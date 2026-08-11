from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from doctors.models import Doctor
from medical_records.models import MedicalRecord
from patients.models import Patient


class Medicine(models.Model):
    class Category(models.TextChoices):
        TABLET = 'tablet', 'Tablet'
        CAPSULE = 'capsule', 'Capsule'
        SYRUP = 'syrup', 'Syrup'
        INJECTION = 'injection', 'Injection'
        OINTMENT = 'ointment', 'Ointment'
        DROPS = 'drops', 'Drops'
        INHALER = 'inhaler', 'Inhaler'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=150, unique=True)
    generic_name = models.CharField(max_length=150, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    unit = models.CharField(max_length=30, default='tablet')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    batch_number = models.CharField(max_length=50, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    supplier = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'medicines'

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.reorder_level

    @property
    def stock_value(self):
        return Decimal(self.stock_quantity) * self.price


class Prescription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        DISPENSED = 'dispensed', 'Dispensed'
        CANCELLED = 'cancelled', 'Cancelled'

    prescription_no = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='prescriptions')
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_prescriptions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.prescription_no} - {self.patient.full_name}'

    def save(self, *args, **kwargs):
        if not self.prescription_no:
            year = timezone.localdate().year
            count = Prescription.objects.filter(prescription_no__startswith=f'RX-{year}').count() + 1
            self.prescription_no = f'RX-{year}-{count:04d}'
        super().save(*args, **kwargs)

    def dispense(self, user):
        """Decrement medicine stock for every line and mark the prescription dispensed."""
        lines = list(self.items.select_related('medicine'))
        short_items = [
            f'{item.medicine.name} (need {item.quantity}, have {item.medicine.stock_quantity})'
            for item in lines
            if item.quantity > item.medicine.stock_quantity
        ]
        if short_items:
            raise ValueError('Insufficient stock: ' + '; '.join(short_items))
        for item in lines:
            medicine = item.medicine
            medicine.stock_quantity -= item.quantity
            medicine.save(update_fields=['stock_quantity', 'updated_at'])
            StockMovement.objects.create(
                medicine=medicine,
                quantity=-item.quantity,
                reason=f'Dispensed {self.prescription_no}',
                user=user,
            )
        self.status = self.Status.DISPENSED
        self.save(update_fields=['status', 'updated_at'])


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name='prescription_items')
    dosage = models.CharField(max_length=100, blank=True, help_text='e.g. 1 tablet')
    frequency = models.CharField(max_length=100, blank=True, help_text='e.g. 2 times a day')
    duration_days = models.PositiveIntegerField(default=1)
    quantity = models.PositiveIntegerField(default=1)
    instructions = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f'{self.medicine.name} x{self.quantity}'

    @property
    def line_total(self):
        return Decimal(self.quantity) * self.medicine.price


class StockMovement(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='stock_movements')
    quantity = models.IntegerField(help_text='Positive for stock in, negative for stock out.')
    reason = models.CharField(max_length=200)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='stock_movements',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.medicine.name}: {self.quantity:+d} ({self.reason})'
