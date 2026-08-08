from django.test import TestCase
from django.urls import reverse

from hospital.tests_utils import (
    create_admin, create_appointment, create_doctor, create_doctor_user,
    create_patient, create_record,
)
from medical_records.models import MedicalRecord


class MedicalRecordTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())

    def test_create_walk_in_record_as_admin(self):
        response = self.client.post(reverse('medical_records:add', args=[self.patient.pk]), {
            'doctor': self.doctor.pk,
            'diagnosis': 'Allergy',
            'prescription': 'Antihistamine',
            'doctor_notes': 'Review in two weeks',
        })
        self.assertRedirects(
            response,
            reverse('medical_records:patient_records', args=[self.patient.pk]),
        )
        record = MedicalRecord.objects.get(patient=self.patient, diagnosis='Allergy')
        self.assertEqual(record.doctor, self.doctor)

    def test_doctor_record_uses_their_profile(self):
        doctor = create_doctor(create_doctor_user(username='prof_doc'))
        self.client.force_login(doctor.user)
        response = self.client.post(reverse('medical_records:add', args=[self.patient.pk]), {
            'diagnosis': 'Flu',
            'prescription': 'Rest',
            'doctor_notes': '',
        })
        self.assertRedirects(
            response,
            reverse('medical_records:patient_records', args=[self.patient.pk]),
        )
        record = MedicalRecord.objects.get(patient=self.patient, diagnosis='Flu')
        self.assertEqual(record.doctor, doctor)

    def test_visit_history_listing(self):
        record = create_record(self.patient, self.doctor, diagnosis='Migraine')
        response = self.client.get(reverse('medical_records:patient_records', args=[self.patient.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Migraine')

    def test_record_detail(self):
        appointment = create_appointment(self.patient, self.doctor)
        record = create_record(
            self.patient, self.doctor, appointment=appointment,
            diagnosis='Hypertension', prescription='Amlodipine',
        )
        response = self.client.get(reverse('medical_records:detail', args=[record.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Hypertension')
        self.assertContains(response, 'Amlodipine')

    def test_missing_patient_returns_404(self):
        response = self.client.get(reverse('medical_records:patient_records', args=[9999]))
        self.assertEqual(response.status_code, 404)


class MedicalRecordRoleGuardTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.record = create_record(self.patient, self.doctor)

    def test_receptionist_blocked_from_creating(self):
        from hospital.tests_utils import create_receptionist
        self.client.force_login(create_receptionist())
        self.assertEqual(
            self.client.get(reverse('medical_records:add', args=[self.patient.pk])).status_code,
            403,
        )

    def test_receptionist_can_view_history(self):
        from hospital.tests_utils import create_receptionist
        self.client.force_login(create_receptionist())
        self.assertEqual(
            self.client.get(reverse('medical_records:patient_records', args=[self.patient.pk])).status_code,
            200,
        )

    def test_anonymous_redirected(self):
        response = self.client.get(reverse('medical_records:patient_records', args=[self.patient.pk]))
        self.assertEqual(response.status_code, 302)
