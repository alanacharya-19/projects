from django.test import TestCase
from django.urls import reverse

from hospital.tests_utils import create_admin, create_doctor_user
from hospital_settings.models import HospitalSettings


class HospitalSettingsModelTests(TestCase):
    def test_get_settings_creates_singleton(self):
        self.assertEqual(HospitalSettings.objects.count(), 0)
        first = HospitalSettings.get_settings()
        second = HospitalSettings.get_settings()
        self.assertEqual(first.pk, 1)
        self.assertEqual(second.pk, 1)
        self.assertEqual(HospitalSettings.objects.count(), 1)

    def test_default_hospital_name(self):
        settings = HospitalSettings.get_settings()
        self.assertEqual(settings.hospital_name, 'MediCare Hospital')
        self.assertEqual(settings.currency, '$')


class HospitalSettingsViewTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)

    def test_admin_can_update_settings(self):
        response = self.client.post(reverse('hospital_settings:index'), {
            'hospital_name': 'City General Hospital',
            'tagline': 'Care first',
            'address': 'Main Road',
            'phone': '555-0100',
            'email': 'info@citygeneral.example',
            'currency': '€',
            'working_hours': 'Mon-Sat 9-6',
            'footer_text': 'City General',
        })
        self.assertRedirects(response, reverse('hospital_settings:index'))
        settings = HospitalSettings.get_settings()
        self.assertEqual(settings.hospital_name, 'City General Hospital')
        self.assertEqual(settings.currency, '€')

    def test_settings_visible_in_context(self):
        settings = HospitalSettings.get_settings()
        settings.hospital_name = 'Northside Clinic'
        settings.save()
        response = self.client.get(reverse('dashboard:index'))
        self.assertEqual(response.context['hospital'].hospital_name, 'Northside Clinic')

    def test_non_admin_cannot_access_settings(self):
        self.client.force_login(create_doctor_user())
        self.assertEqual(self.client.get(reverse('hospital_settings:index')).status_code, 403)
