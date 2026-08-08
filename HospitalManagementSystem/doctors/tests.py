from django.test import TestCase
from django.urls import reverse

from hospital.tests_utils import (
    create_admin, create_doctor, create_doctor_user, create_receptionist,
)
from doctors.models import Doctor


class DepartmentCrudTests(TestCase):
    def setUp(self):
        self.client.force_login(create_admin())

    def test_list(self):
        response = self.client.get(reverse('departments:list'))
        self.assertEqual(response.status_code, 200)

    def test_create(self):
        response = self.client.post(reverse('departments:add'), {
            'name': 'Dermatology',
            'description': 'Skin care',
        })
        self.assertRedirects(response, reverse('departments:list'))
        from departments.models import Department
        self.assertTrue(Department.objects.filter(name='Dermatology').exists())

    def test_edit(self):
        from departments.models import Department
        dept = Department.objects.create(name='Dermatology')
        response = self.client.post(reverse('departments:edit', args=[dept.pk]), {
            'name': 'Dermatology',
            'description': 'Skin and hair',
        })
        self.assertRedirects(response, reverse('departments:list'))
        dept.refresh_from_db()
        self.assertEqual(dept.description, 'Skin and hair')

    def test_delete(self):
        from departments.models import Department
        dept = Department.objects.create(name='Temp')
        response = self.client.post(reverse('departments:delete', args=[dept.pk]))
        self.assertRedirects(response, reverse('departments:list'))
        self.assertFalse(Department.objects.filter(pk=dept.pk).exists())


class DepartmentRoleGuardTests(TestCase):
    def test_receptionist_blocked(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('departments:list')).status_code, 403)
        self.assertEqual(self.client.get(reverse('departments:add')).status_code, 403)

    def test_doctor_blocked(self):
        self.client.force_login(create_doctor_user())
        self.assertEqual(self.client.get(reverse('departments:list')).status_code, 403)


class DoctorCrudTests(TestCase):
    def setUp(self):
        self.client.force_login(create_admin())

    def test_create_creates_user_and_profile(self):
        response = self.client.post(reverse('doctors:add'), {
            'username': 'new_doc',
            'first_name': 'New',
            'last_name': 'Doctor',
            'password': 'T3stPass!',
            'specialty': 'GP',
            'consultation_fee': '50',
        })
        self.assertRedirects(response, reverse('doctors:list'))
        doctor = Doctor.objects.get(user__username='new_doc')
        self.assertEqual(doctor.user.role, 'doctor')
        self.assertTrue(doctor.user.check_password('T3stPass!'))

    def test_create_requires_password(self):
        response = self.client.post(reverse('doctors:add'), {
            'username': 'no_pass',
            'first_name': 'No',
            'last_name': 'Pass',
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Doctor.objects.filter(user__username='no_pass').exists())

    def test_duplicate_username_rejected(self):
        create_doctor(create_doctor_user(first_name='Existing'))
        response = self.client.post(reverse('doctors:add'), {
            'username': 'doctor',
            'first_name': 'New',
            'last_name': 'Doc',
            'password': 'T3stPass!',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Doctor.objects.count(), 1)

    def test_edit_updates_profile_and_keeps_password(self):
        doctor = create_doctor(create_doctor_user(first_name='Old', last_name='Name'))
        response = self.client.post(reverse('doctors:edit', args=[doctor.pk]), {
            'username': 'doctor',
            'first_name': 'New',
            'last_name': 'Name',
            'specialty': 'Cardiologist',
            'consultation_fee': '120',
        })
        self.assertRedirects(response, reverse('doctors:list'))
        doctor.user.refresh_from_db()
        self.assertEqual(doctor.user.first_name, 'New')
        self.assertTrue(doctor.user.check_password('password123'))

    def test_profile_page(self):
        doctor = create_doctor(create_doctor_user(first_name='Show', last_name='Me'))
        response = self.client.get(reverse('doctors:profile', args=[doctor.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Show Me')

    def test_delete_removes_user_account(self):
        doctor = create_doctor(create_doctor_user())
        response = self.client.post(reverse('doctors:delete', args=[doctor.pk]))
        self.assertRedirects(response, reverse('doctors:list'))
        self.assertFalse(Doctor.objects.filter(pk=doctor.pk).exists())
        from django.contrib.auth import get_user_model
        self.assertFalse(get_user_model().objects.filter(pk=doctor.user_id).exists())


class DoctorListTests(TestCase):
    def test_search_by_name(self):
        self.client.force_login(create_admin())
        create_doctor(create_doctor_user(first_name='Alice', last_name='Brown'))
        create_doctor(create_doctor_user(username='doctor2', first_name='Bob', last_name='Smith'))
        response = self.client.get(reverse('doctors:list'), {'q': 'Alice'})
        self.assertContains(response, 'Alice Brown')
        self.assertNotContains(response, 'Bob Smith')

    def test_receptionist_can_view_list(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('doctors:list')).status_code, 200)

    def test_receptionist_blocked_from_management(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('doctors:add')).status_code, 403)
