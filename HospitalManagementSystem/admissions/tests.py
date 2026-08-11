from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from admissions.models import Admission, Room
from hospital.tests_utils import (
    create_admin, create_doctor, create_doctor_user, create_patient, create_receptionist,
)


def make_room(room_number='101', room_type='private', rate=100, capacity=1, status=Room.Status.AVAILABLE):
    return Room.objects.create(
        room_number=room_number,
        room_type=room_type,
        rate_per_day=rate,
        capacity=capacity,
        status=status,
    )


def admission_post_data(patient, room, doctor=None):
    return {
        'patient': patient.pk,
        'room': room.pk,
        'assigned_doctor': doctor.pk if doctor else '',
        'reason': 'Observation',
        'expected_discharge': '',
        'notes': '',
    }


class RoomModelTests(TestCase):
    def setUp(self):
        self.room = make_room(capacity=1)
        self.patient = create_patient()

    def test_active_admissions_and_is_full(self):
        self.assertFalse(self.room.is_full)
        Admission.objects.create(patient=self.patient, room=self.room)
        self.room.refresh_from_db()
        self.assertEqual(self.room.active_admissions, 1)
        self.assertTrue(self.room.is_full)

    def test_refresh_status_marks_room_occupied(self):
        Admission.objects.create(patient=self.patient, room=self.room)
        self.room.refresh_status()
        self.assertEqual(self.room.status, Room.Status.OCCUPIED)

    def test_refresh_status_preserves_maintenance(self):
        maintenance = make_room(room_number='999', status=Room.Status.MAINTENANCE)
        Admission.objects.create(patient=self.patient, room=maintenance)
        maintenance.refresh_status()
        self.assertEqual(maintenance.status, Room.Status.MAINTENANCE)


class AdmissionModelTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.room = make_room(room_number='101')
        self.doctor = create_doctor(create_doctor_user())

    def test_admission_number_format(self):
        admission = Admission.objects.create(patient=self.patient, room=self.room)
        year = timezone.localdate().year
        self.assertRegex(admission.admission_no, rf'^ADM-{year}-\d{{4}}$')

    def test_admission_numbers_increment(self):
        first = Admission.objects.create(patient=self.patient, room=self.room)
        second = Admission.objects.create(patient=self.patient, room=self.room)
        year = timezone.localdate().year
        self.assertEqual(first.admission_no, f'ADM-{year}-0001')
        self.assertEqual(second.admission_no, f'ADM-{year}-0002')

    def test_days_stayed_and_stay_charge(self):
        admission = Admission.objects.create(
            patient=self.patient,
            room=self.room,
            admitted_at=timezone.now() - timedelta(days=3),
            discharged_at=timezone.now() - timedelta(days=1),
        )
        self.assertEqual(admission.days_stayed, 3)
        self.assertEqual(admission.stay_charge, Decimal('300.00'))

    def test_discharge_sets_status_and_frees_room(self):
        admission = Admission.objects.create(patient=self.patient, room=self.room)
        self.room.refresh_status()
        self.assertEqual(self.room.status, Room.Status.OCCUPIED)
        admission.discharge()
        admission.refresh_from_db()
        self.assertEqual(admission.status, Admission.Status.DISCHARGED)
        self.assertIsNotNone(admission.discharged_at)
        self.room.refresh_from_db()
        self.assertEqual(self.room.status, Room.Status.AVAILABLE)

    def test_transfer_to_full_room_raises(self):
        room_a = make_room(room_number='201', capacity=1)
        room_b = make_room(room_number='202', capacity=1)
        Admission.objects.create(patient=self.patient, room=room_b)
        admission = Admission.objects.create(patient=create_patient(full_name='Jane Roe'), room=room_a)
        with self.assertRaises(ValueError):
            admission.transfer(room_b)

    def test_transfer_moves_room_and_refreshes(self):
        room_a = make_room(room_number='301', capacity=1)
        room_b = make_room(room_number='302', capacity=1)
        admission = Admission.objects.create(patient=self.patient, room=room_a)
        admission.transfer(room_b)
        admission.refresh_from_db()
        self.assertEqual(admission.room, room_b)
        room_a.refresh_from_db()
        room_b.refresh_from_db()
        self.assertEqual(room_a.status, Room.Status.AVAILABLE)
        self.assertEqual(room_b.status, Room.Status.OCCUPIED)


class AdmissionCreateViewTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.receptionist = create_receptionist()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.room = make_room(capacity=1)

    def test_admin_can_create_admission(self):
        response = self.client.post(
            reverse('admissions:admission_create'),
            admission_post_data(self.patient, self.room, self.doctor),
        )
        self.assertRedirects(response, reverse('admissions:admission_list'))
        admission = Admission.objects.get()
        self.assertEqual(admission.patient, self.patient)
        self.assertEqual(admission.room, self.room)
        self.assertEqual(admission.assigned_doctor, self.doctor)
        self.assertEqual(admission.created_by, self.admin)
        self.assertEqual(admission.status, Admission.Status.ADMITTED)
        self.room.refresh_from_db()
        self.assertEqual(self.room.status, Room.Status.OCCUPIED)

    def test_receptionist_can_create_admission(self):
        self.client.force_login(self.receptionist)
        response = self.client.post(
            reverse('admissions:admission_create'),
            admission_post_data(self.patient, self.room),
        )
        self.assertRedirects(response, reverse('admissions:admission_list'))
        self.assertEqual(Admission.objects.get().created_by, self.receptionist)

    def test_doctor_cannot_create_admission(self):
        self.client.force_login(self.doctor.user)
        self.assertEqual(self.client.get(reverse('admissions:admission_create')).status_code, 403)

    def test_cannot_admit_to_full_room(self):
        Admission.objects.create(patient=create_patient(full_name='Jane Roe'), room=self.room)
        response = self.client.post(
            reverse('admissions:admission_create'),
            admission_post_data(self.patient, self.room),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Admission.objects.filter(status=Admission.Status.ADMITTED).count(), 1)

    def test_cannot_admit_to_maintenance_room(self):
        maintenance = make_room(room_number='555', status=Room.Status.MAINTENANCE)
        response = self.client.post(
            reverse('admissions:admission_create'),
            admission_post_data(self.patient, maintenance),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Admission.objects.count(), 0)


class AdmissionWorkflowTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.room = make_room(capacity=1)
        self.admission = Admission.objects.create(patient=self.patient, room=self.room)
        self.room.refresh_status()

    def test_discharge_frees_room(self):
        self.client.post(reverse('admissions:admission_discharge', args=[self.admission.pk]))
        self.admission.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(self.admission.status, Admission.Status.DISCHARGED)
        self.assertEqual(self.room.status, Room.Status.AVAILABLE)

    def test_transfer_moves_to_new_room(self):
        target = make_room(room_number='222', capacity=1)
        self.client.post(reverse('admissions:admission_transfer', args=[self.admission.pk]), {'room': target.pk})
        self.admission.refresh_from_db()
        self.assertEqual(self.admission.room, target)
        self.room.refresh_from_db()
        target.refresh_from_db()
        self.assertEqual(self.room.status, Room.Status.AVAILABLE)
        self.assertEqual(target.status, Room.Status.OCCUPIED)

    def test_transfer_to_full_room_rejected(self):
        target = make_room(room_number='223', capacity=1)
        Admission.objects.create(patient=create_patient(full_name='Jane Roe'), room=target)
        target.refresh_status()
        self.client.post(reverse('admissions:admission_transfer', args=[self.admission.pk]), {'room': target.pk})
        self.admission.refresh_from_db()
        self.assertEqual(self.admission.room, self.room)

    def test_cancel_admin_only(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(
            self.client.post(reverse('admissions:admission_cancel', args=[self.admission.pk])).status_code, 403,
        )
        self.client.force_login(self.admin)
        self.assertRedirects(
            self.client.post(reverse('admissions:admission_cancel', args=[self.admission.pk])),
            reverse('admissions:admission_detail', args=[self.admission.pk]),
        )
        self.admission.refresh_from_db()
        self.assertEqual(self.admission.status, Admission.Status.CANCELLED)
        self.room.refresh_from_db()
        self.assertEqual(self.room.status, Room.Status.AVAILABLE)


class RoomRoleGuardTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.room = make_room()

    def test_room_crud_admin_only(self):
        self.client.force_login(create_doctor_user(username='guard_doc'))
        self.assertEqual(self.client.get(reverse('admissions:room_add')).status_code, 403)
        self.assertEqual(self.client.get(reverse('admissions:room_edit', args=[self.room.pk])).status_code, 403)
        self.assertEqual(self.client.get(reverse('admissions:room_delete', args=[self.room.pk])).status_code, 403)

    def test_room_list_visible_to_all_staff(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('admissions:room_list')).status_code, 200)

    def test_room_with_admissions_cannot_be_deleted(self):
        patient = create_patient()
        Admission.objects.create(patient=patient, room=self.room)
        self.client.force_login(self.admin)
        response = self.client.post(reverse('admissions:room_delete', args=[self.room.pk]))
        self.assertRedirects(response, reverse('admissions:room_list'))
        self.assertTrue(Room.objects.filter(pk=self.room.pk).exists())


class AdmissionListRoleTests(TestCase):
    def test_doctor_sees_only_own_admissions(self):
        doctor_a = create_doctor(create_doctor_user(username='adm_doc_a'))
        doctor_b = create_doctor(create_doctor_user(username='adm_doc_b'))
        patient = create_patient()
        room = make_room(capacity=2)
        Admission.objects.create(patient=patient, room=room, assigned_doctor=doctor_a)
        Admission.objects.create(
            patient=create_patient(full_name='Jane Roe'), room=room, assigned_doctor=doctor_b,
        )
        self.client.force_login(doctor_a.user)
        response = self.client.get(reverse('admissions:admission_list'))
        self.assertEqual(response.context['admissions'].count(), 1)
        self.assertEqual(response.context['admissions'][0].assigned_doctor, doctor_a)

    def test_anonymous_redirected_to_login(self):
        response = self.client.get(reverse('admissions:admission_list'))
        self.assertRedirects(response, f"{reverse('accounts:login')}?next={reverse('admissions:admission_list')}")
