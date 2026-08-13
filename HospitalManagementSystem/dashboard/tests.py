from django.core.management import call_command
from django.test import Client, TestCase
from django.urls import reverse

from admissions.models import Admission, Room
from appointments.models import Appointment
from billing.models import Invoice
from departments.models import Department
from doctors.models import Doctor
from laboratory.models import LabTestOrder, LabTestType
from medical_records.models import MedicalRecord
from patients.models import Patient
from pharmacy.models import Medicine, Prescription
from hospital.tests_utils import (
    create_admin, create_appointment, create_doctor, create_doctor_user,
    create_patient,
)


class DashboardTests(TestCase):
    def setUp(self):
        self.client.force_login(create_admin())

    def test_dashboard_shows_counts(self):
        patient = create_patient()
        create_patient(full_name='Second Patient', phone='555-0202')
        doctor = create_doctor(create_doctor_user())
        create_appointment(patient, doctor)

        response = self.client.get(reverse('dashboard:index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Total Patients')
        self.assertContains(response, 'Total Doctors')
        self.assertContains(response, "Today's Appointments")

    def test_dashboard_requires_login(self):
        response = Client().get(reverse('dashboard:index'))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse('accounts:login'), response.url)


class SeedDemoCommandTests(TestCase):
    def test_seed_demo_is_idempotent_and_populates_all_modules(self):
        call_command('seed_demo')
        call_command('seed_demo')

        self.assertTrue(Department.objects.filter(name='Cardiology').exists())
        self.assertTrue(Medicine.objects.filter(name='Paracetamol 500mg').exists())
        self.assertTrue(LabTestType.objects.filter(name='Complete Blood Count').exists())
        self.assertEqual(Room.objects.filter(room_number='ICU-01').count(), 1)
        self.assertEqual(Patient.objects.count(), 5)
        self.assertTrue(Doctor.objects.filter(user__username='doctor').exists())
        self.assertTrue(Appointment.objects.filter(patient__phone='0300-0000001').exists())
        self.assertTrue(MedicalRecord.objects.exists())
        self.assertTrue(Invoice.objects.exists())
        self.assertTrue(Prescription.objects.exists())
        self.assertTrue(LabTestOrder.objects.exists())
        self.assertTrue(Admission.objects.exists())

        self.assertTrue(Appointment.objects.filter(
            patient__phone='0300-0000001',
        ).count() <= 1, 'Re-running seed must not duplicate demo records')
