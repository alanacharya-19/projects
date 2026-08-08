from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from hospital.tests_utils import create_admin, create_doctor_user, create_receptionist

User = get_user_model()


class UserModelTests(TestCase):
    def test_role_helpers(self):
        admin = create_admin()
        doctor = create_doctor_user()
        receptionist = create_receptionist()

        self.assertTrue(admin.is_admin())
        self.assertFalse(admin.is_doctor())

        self.assertTrue(doctor.is_doctor())
        self.assertTrue(receptionist.is_receptionist())

    def test_str_includes_role(self):
        user = create_receptionist(first_name='Anna', last_name='Reed')
        self.assertIn('Receptionist', str(user))


class LoginLogoutTests(TestCase):
    def test_login_redirects_to_dashboard(self):
        create_admin()
        response = self.client.post(reverse('accounts:login'), {
            'username': 'admin',
            'password': 'password123',
        })
        self.assertRedirects(response, reverse('dashboard:index'))

    def test_login_rejects_bad_credentials(self):
        create_admin()
        response = self.client.post(reverse('accounts:login'), {
            'username': 'admin',
            'password': 'wrong',
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'form')

    def test_logout_requires_post_and_redirects_to_login(self):
        admin = create_admin()
        self.client.force_login(admin)
        response = self.client.get(reverse('accounts:logout'))
        self.assertEqual(response.status_code, 405)

        response = self.client.post(reverse('accounts:logout'))
        self.assertRedirects(response, reverse('accounts:login'))

    def test_login_page_reachable(self):
        response = self.client.get(reverse('accounts:login'))
        self.assertEqual(response.status_code, 200)


class AuthenticationRedirectTests(TestCase):
    def test_anonymous_redirected_to_login(self):
        for url in [reverse('dashboard:index'), reverse('patients:list'),
                    reverse('doctors:list'), reverse('appointments:list')]:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 302)
                self.assertIn(reverse('accounts:login'), response.url)
