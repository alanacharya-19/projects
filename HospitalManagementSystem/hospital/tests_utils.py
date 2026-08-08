"""Shared test factories used across app test suites."""
from datetime import date, time

from django.contrib.auth import get_user_model
from django.utils import timezone

from appointments.models import Appointment
from departments.models import Department
from doctors.models import Doctor
from medical_records.models import MedicalRecord
from patients.models import Patient

User = get_user_model()


def create_user(username, role, password='password123', first_name='Test', last_name='User'):
    user = User.objects.create_user(
        username=username,
        password=password,
        role=role,
        first_name=first_name,
        last_name=last_name,
        is_staff=True,
    )
    return user


def create_admin(**kwargs):
    return create_user('admin', User.Role.ADMIN, **kwargs)


def create_receptionist(**kwargs):
    return create_user('receptionist', User.Role.RECEPTIONIST, **kwargs)


def create_doctor_user(**kwargs):
    return create_user('doctor', User.Role.DOCTOR, **kwargs)


def create_department(name='Cardiology', **kwargs):
    return Department.objects.create(name=name, **kwargs)


def create_doctor(user, department=None, specialty='Cardiologist', **kwargs):
    return Doctor.objects.create(
        user=user,
        department=department,
        specialty=specialty,
        consultation_fee=100,
        **kwargs,
    )


def create_patient(full_name='John Carter', phone='555-0101', **kwargs):
    return Patient.objects.create(
        full_name=full_name,
        gender='M',
        phone=phone,
        **kwargs,
    )


def create_appointment(patient, doctor, on_date=None, at_time=None, status=Appointment.Status.SCHEDULED, **kwargs):
    return Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        date=on_date or timezone.localdate() + timezone.timedelta(days=1),
        time=at_time or time(9, 0),
        status=status,
        **kwargs,
    )


def create_record(patient, doctor, appointment=None, diagnosis='Flu', **kwargs):
    return MedicalRecord.objects.create(
        patient=patient,
        doctor=doctor,
        appointment=appointment,
        diagnosis=diagnosis,
        **kwargs,
    )
