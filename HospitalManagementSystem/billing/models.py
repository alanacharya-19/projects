from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from appointments.models import Appointment
from patients.models import Patient


class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        PARTIAL = 'partial', 'Partially Paid'
        CANCELLED = 'cancelled', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        ONLINE = 'online', 'Online'
        INSURANCE = 'insurance', 'Insurance'

    invoice_no = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='invoices')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_invoices',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.invoice_no} - {self.patient.full_name}'

    @property
    def subtotal(self):
        return sum((item.line_total for item in self.items.all()), Decimal('0.00'))

    @property
    def total(self):
        total = self.subtotal + self.tax - self.discount
        return max(total, Decimal('0.00'))

    @property
    def balance(self):
        return max(self.total - self.paid_amount, Decimal('0.00'))

    @property
    def is_settled(self):
        return self.status in (self.Status.PAID, self.Status.CANCELLED)

    def save(self, *args, **kwargs):
        if not self.invoice_no:
            year = timezone.localdate().year
            count = Invoice.objects.filter(invoice_no__startswith=f'INV-{year}').count() + 1
            self.invoice_no = f'INV-{year}-{count:04d}'
        if self.status == self.Status.PAID and self.paid_amount == 0:
            self.paid_amount = self.total
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.description

    @property
    def line_total(self):
        return Decimal(self.quantity) * self.unit_price
