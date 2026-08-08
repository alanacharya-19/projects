from django.test import TestCase
from django.urls import reverse

from hospital.tests_utils import create_admin, create_receptionist
from patients.models import Patient


class PatientListTests(TestCase):
    def setUp(self):
        self.client.force_login(create_admin())

    def test_list_shows_patients(self):
        Patient.objects.create(full_name='Emily Watson', gender='F', phone='555-0202')
        response = self.client.get(reverse('patients:list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Emily Watson')

    def test_search_by_name(self):
        Patient.objects.create(full_name='John Carter', gender='M', phone='555-0101')
        Patient.objects.create(full_name='Emily Watson', gender='F', phone='555-0202')
        response = self.client.get(reverse('patients:list'), {'q': 'Carter'})
        self.assertContains(response, 'John Carter')
        self.assertNotContains(response, 'Emily Watson')

    def test_search_by_phone(self):
        Patient.objects.create(full_name='John Carter', gender='M', phone='555-1234')
        response = self.client.get(reverse('patients:list'), {'q': '555-1234'})
        self.assertContains(response, 'John Carter')


class PatientCreateTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)

    def test_create_patient_sets_creator(self):
        response = self.client.post(reverse('patients:add'), {
            'full_name': 'Test Patient',
            'gender': 'M',
            'phone': '555-9999',
        })
        self.assertRedirects(response, reverse('patients:list'))
        patient = Patient.objects.get(full_name='Test Patient')
        self.assertEqual(patient.created_by, self.admin)

    def test_create_requires_phone(self):
        response = self.client.post(reverse('patients:add'), {'full_name': 'No Phone'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Patient.objects.filter(full_name='No Phone').exists())


class PatientEditDeleteTests(TestCase):
    def setUp(self):
        self.client.force_login(create_admin())
        self.patient = Patient.objects.create(full_name='Old Name', gender='F', phone='555-0001')

    def test_edit_patient(self):
        response = self.client.post(reverse('patients:edit', args=[self.patient.pk]), {
            'full_name': 'New Name',
            'gender': 'F',
            'phone': '555-0002',
        })
        self.assertRedirects(response, reverse('patients:list'))
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.full_name, 'New Name')

    def test_delete_patient_without_records(self):
        response = self.client.post(reverse('patients:delete', args=[self.patient.pk]))
        self.assertRedirects(response, reverse('patients:list'))
        self.assertFalse(Patient.objects.filter(pk=self.patient.pk).exists())

    def test_delete_patient_with_appointment_is_protected(self):
        from hospital.tests_utils import create_doctor_user, create_doctor, create_appointment
        doctor = create_doctor(create_doctor_user())
        create_appointment(self.patient, doctor)
        response = self.client.post(reverse('patients:delete', args=[self.patient.pk]))
        self.assertRedirects(response, reverse('patients:detail', args=[self.patient.pk]))
        self.assertTrue(Patient.objects.filter(pk=self.patient.pk).exists())

    def test_confirm_delete_warns_about_related_records(self):
        from hospital.tests_utils import create_doctor_user, create_doctor, create_appointment
        doctor = create_doctor(create_doctor_user())
        create_appointment(self.patient, doctor)
        response = self.client.get(reverse('patients:delete', args=[self.patient.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'cannot be deleted')


class PatientRoleGuardTests(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(full_name='Guard Test', gender='M', phone='555-7777')

    def test_receptionist_can_create_and_delete(self):
        receptionist = create_receptionist()
        self.client.force_login(receptionist)
        self.assertEqual(self.client.get(reverse('patients:add')).status_code, 200)
        self.assertEqual(self.client.get(reverse('patients:delete', args=[self.patient.pk])).status_code, 200)

    def test_doctor_cannot_create(self):
        from hospital.tests_utils import create_doctor_user
        self.client.force_login(create_doctor_user())
        self.assertEqual(self.client.get(reverse('patients:add')).status_code, 403)

    def test_doctor_can_view(self):
        from hospital.tests_utils import create_doctor_user
        self.client.force_login(create_doctor_user())
        self.assertEqual(self.client.get(reverse('patients:list')).status_code, 200)
        self.assertEqual(self.client.get(reverse('patients:detail', args=[self.patient.pk])).status_code, 200)


class PatientDetailTests(TestCase):
    def test_detail_shows_patient_info_and_history(self):
        from hospital.tests_utils import (
            create_doctor_user, create_doctor, create_record, create_appointment,
        )
        admin = create_admin()
        self.client.force_login(admin)
        doctor = create_doctor(create_doctor_user())
        patient = Patient.objects.create(full_name='Detail Patient', gender='F', phone='555-4321')
        appointment = create_appointment(patient, doctor)
        create_record(patient, doctor, appointment=appointment, diagnosis='Migraine')

        response = self.client.get(reverse('patients:detail', args=[patient.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Migraine')
