from django.conf import settings
from django.db import models
from django.utils import timezone

from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient


class LabTestType(models.Model):
    class Category(models.TextChoices):
        BLOOD = 'blood', 'Blood'
        URINE = 'urine', 'Urine'
        IMAGING = 'imaging', 'Imaging'
        MICROBIOLOGY = 'microbiology', 'Microbiology'
        PATHOLOGY = 'pathology', 'Pathology'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.OTHER)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reference_range = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class LabTestOrder(models.Model):
    class Status(models.TextChoices):
        ORDERED = 'ordered', 'Ordered'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    order_no = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='lab_orders')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='lab_orders')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lab_orders',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ORDERED)
    clinical_notes = models.TextField(blank=True)
    ordered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='lab_orders_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no} - {self.patient.full_name}'

    def save(self, *args, **kwargs):
        if not self.order_no:
            year = timezone.localdate().year
            count = LabTestOrder.objects.filter(order_no__startswith=f'LAB-{year}').count() + 1
            self.order_no = f'LAB-{year}-{count:04d}'
        super().save(*args, **kwargs)

    @property
    def total(self):
        return sum((item.line_price for item in self.items.all()), __import__('decimal').Decimal('0.00'))

    @property
    def completed_count(self):
        return self.items.filter(status=LabTestItem.Status.COMPLETED).count()


class LabTestItem(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    order = models.ForeignKey(LabTestOrder, on_delete=models.CASCADE, related_name='items')
    test_type = models.ForeignKey(LabTestType, on_delete=models.PROTECT, related_name='order_items')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    result = models.TextField(blank=True)
    reference_range = models.CharField(max_length=200, blank=True)
    notes = models.CharField(max_length=300, blank=True)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='completed_lab_items',
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.order.order_no} - {self.test_type.name}'

    @property
    def line_price(self):
        return self.test_type.price

    def mark_completed(self, user, result, notes='', reference_range=None):
        self.status = self.Status.COMPLETED
        self.result = result
        self.notes = notes
        if reference_range is not None:
            self.reference_range = reference_range
        self.completed_by = user
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'result', 'notes', 'completed_by', 'completed_at'])
        if reference_range is not None:
            self.save(update_fields=['reference_range'])
        self.order.refresh_from_db()
        pending = self.order.items.exclude(status=self.Status.CANCELLED).filter(
            status=self.Status.PENDING,
        ).count()
        if pending == 0:
            self.order.status = LabTestOrder.Status.COMPLETED
            self.order.save(update_fields=['status', 'updated_at'])
