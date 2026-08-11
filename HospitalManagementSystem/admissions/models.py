from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from doctors.models import Doctor
from patients.models import Patient


class Room(models.Model):
    class RoomType(models.TextChoices):
        GENERAL = 'general', 'General Ward'
        SEMI_PRIVATE = 'semi_private', 'Semi Private'
        PRIVATE = 'private', 'Private'
        ICU = 'icu', 'ICU'

    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        OCCUPIED = 'occupied', 'Occupied'
        MAINTENANCE = 'maintenance', 'Maintenance'

    room_number = models.CharField(max_length=20, unique=True)
    floor = models.CharField(max_length=30, blank=True)
    room_type = models.CharField(max_length=20, choices=RoomType.choices, default=RoomType.GENERAL)
    rate_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    capacity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    notes = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['room_number']

    def __str__(self):
        return self.room_number

    @property
    def active_admissions(self):
        return self.admissions.filter(status=Admission.Status.ADMITTED).count()

    @property
    def is_full(self):
        return self.active_admissions >= self.capacity

    def refresh_status(self, save=True):
        if self.status != self.Status.MAINTENANCE:
            self.status = self.Status.OCCUPIED if self.is_full else self.Status.AVAILABLE
            if save:
                self.save(update_fields=['status', 'updated_at'])
        return self.status


class Admission(models.Model):
    class Status(models.TextChoices):
        ADMITTED = 'admitted', 'Admitted'
        DISCHARGED = 'discharged', 'Discharged'
        CANCELLED = 'cancelled', 'Cancelled'

    admission_no = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='admissions')
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='admissions')
    assigned_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='admissions')
    reason = models.CharField(max_length=300, blank=True)
    admitted_at = models.DateTimeField(default=timezone.now)
    expected_discharge = models.DateField(null=True, blank=True)
    discharged_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ADMITTED)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_admissions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-admitted_at']

    def __str__(self):
        return f'{self.admission_no} - {self.patient.full_name}'

    def save(self, *args, **kwargs):
        if not self.admission_no:
            year = timezone.localdate().year
            count = Admission.objects.filter(admission_no__startswith=f'ADM-{year}').count() + 1
            self.admission_no = f'ADM-{year}-{count:04d}'
        super().save(*args, **kwargs)

    @property
    def days_stayed(self):
        end = self.discharged_at or timezone.now()
        return max((end - self.admitted_at).days + 1, 1)

    @property
    def stay_charge(self):
        return Decimal(self.days_stayed) * self.room.rate_per_day

    def discharge(self):
        self.status = self.Status.DISCHARGED
        self.discharged_at = timezone.now()
        self.save(update_fields=['status', 'discharged_at', 'updated_at'])
        self.room.refresh_status()

    def transfer(self, new_room):
        old_room = self.room
        if new_room != old_room and new_room.is_full:
            raise ValueError(f'{new_room.room_number} is full.')
        self.room = new_room
        self.save(update_fields=['room', 'updated_at'])
        old_room.refresh_status()
        new_room.refresh_status()
