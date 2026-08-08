from django.test import Client, TestCase
from django.urls import reverse

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
