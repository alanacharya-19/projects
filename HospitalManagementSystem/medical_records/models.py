from django.conf import settings
from django.db import models

from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient


class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='medical_records')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='medical_records')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medical_records',
    )
    diagnosis = models.TextField()
    prescription = models.TextField(blank=True)
    doctor_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Record for {self.patient.full_name} on {self.created_at:%b %d, %Y}'
