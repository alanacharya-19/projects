from datetime import time

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from hospital.tests_utils import (
    create_admin, create_appointment, create_doctor, create_doctor_user,
    create_patient, create_receptionist,
)
from appointments.models import Appointment


class AppointmentBookingTests(TestCase):
    def setUp(self):
        self.client.force_login(create_receptionist())
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())

    def test_book_appointment(self):
        response = self.client.post(reverse('appointments:book'), {
            'patient': self.patient.pk,
            'doctor': self.doctor.pk,
            'date': timezone.localdate().isoformat(),
            'time': '10:00',
            'reason': 'Checkup',
        })
        self.assertRedirects(response, reverse('appointments:list'))
        self.assertEqual(Appointment.objects.count(), 1)
        appt = Appointment.objects.get()
        self.assertEqual(appt.patient, self.patient)
        self.assertEqual(appt.doctor, self.doctor)
        self.assertEqual(appt.status, Appointment.Status.SCHEDULED)

    def test_rejects_past_date(self):
        past = (timezone.localdate() - timezone.timedelta(days=1)).isoformat()
        response = self.client.post(reverse('appointments:book'), {
            'patient': self.patient.pk,
            'doctor': self.doctor.pk,
            'date': past,
            'time': '10:00',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Appointment.objects.count(), 0)

    def test_rejects_double_booking_same_slot(self):
        self.create_appointment_at('10:00')
        response = self.client.post(reverse('appointments:book'), {
            'patient': self.patient.pk,
            'doctor': self.doctor.pk,
            'date': timezone.localdate().isoformat(),
            'time': '10:00',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_allows_same_doctor_different_time(self):
        self.create_appointment_at('10:00')
        response = self.client.post(reverse('appointments:book'), {
            'patient': self.patient.pk,
            'doctor': self.doctor.pk,
            'date': timezone.localdate().isoformat(),
            'time': '11:00',
        })
        self.assertRedirects(response, reverse('appointments:list'))
        self.assertEqual(Appointment.objects.count(), 2)

    def create_appointment_at(self, time_str):
        hour, minute = map(int, time_str.split(':'))
        return create_appointment(
            self.patient,
            self.doctor,
            on_date=timezone.localdate(),
            at_time=time(hour, minute),
        )


class AppointmentWorkflowTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.appointment = create_appointment(self.patient, self.doctor)

    def test_cancel_appointment(self):
        response = self.client.get(reverse('appointments:cancel', args=[self.appointment.pk]))
        self.assertEqual(response.status_code, 200)

        response = self.client.post(reverse('appointments:cancel', args=[self.appointment.pk]))
        self.assertRedirects(response, reverse('appointments:list'))
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, Appointment.Status.CANCELLED)

    def test_complete_appointment_creates_record(self):
        response = self.client.post(reverse('appointments:complete', args=[self.appointment.pk]), {
            'diagnosis': 'Hypertension',
            'prescription': 'Amlodipine 5mg',
            'doctor_notes': 'Monitor monthly',
        })
        self.assertRedirects(response, reverse('appointments:list'))
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, Appointment.Status.COMPLETED)
        from medical_records.models import MedicalRecord
        record = MedicalRecord.objects.get(appointment=self.appointment)
        self.assertEqual(record.patient, self.patient)
        self.assertEqual(record.doctor, self.doctor)
        self.assertEqual(record.diagnosis, 'Hypertension')

    def test_complete_requires_diagnosis(self):
        response = self.client.post(reverse('appointments:complete', args=[self.appointment.pk]), {})
        self.assertEqual(response.status_code, 200)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, Appointment.Status.SCHEDULED)

    def test_cannot_complete_cancelled_appointment(self):
        self.appointment.status = Appointment.Status.CANCELLED
        self.appointment.save()
        response = self.client.get(reverse('appointments:complete', args=[self.appointment.pk]))
        self.assertEqual(response.status_code, 403)

    def test_cannot_complete_twice(self):
        self.appointment.status = Appointment.Status.COMPLETED
        self.appointment.save()
        response = self.client.get(reverse('appointments:complete', args=[self.appointment.pk]))
        self.assertEqual(response.status_code, 403)


class AppointmentFilterTests(TestCase):
    def setUp(self):
        self.client.force_login(create_admin())
        self.patient_a = create_patient(full_name='Alpha Patient')
        self.patient_b = create_patient(full_name='Beta Patient')
        self.doctor_a = create_doctor(create_doctor_user(username='doc_a', first_name='Alice'))
        self.doctor_b = create_doctor(create_doctor_user(username='doc_b', first_name='Bob'))
        today = timezone.localdate()
        create_appointment(self.patient_a, self.doctor_a, on_date=today)
        create_appointment(self.patient_b, self.doctor_b, on_date=today + timezone.timedelta(days=3))

    def test_filter_by_doctor(self):
        response = self.client.get(reverse('appointments:list'), {'doctor': self.doctor_a.pk})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Alpha Patient')
        self.assertNotContains(response, 'Beta Patient')

    def test_filter_by_status(self):
        create_appointment(
            self.patient_b, self.doctor_b,
            on_date=timezone.localdate() + timezone.timedelta(days=1),
            status=Appointment.Status.CANCELLED,
        )
        response = self.client.get(reverse('appointments:list'), {'status': 'cancelled'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Beta Patient')
        self.assertNotContains(response, 'Alpha Patient')

    def test_doctor_sees_only_own_appointments(self):
        self.client.force_login(create_doctor_user(username='doc_view', first_name='View'))
        response = self.client.get(reverse('appointments:list'))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'Alpha Patient')
        self.assertNotContains(response, 'Beta Patient')


class AppointmentRoleGuardTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.appointment = create_appointment(self.patient, self.doctor)

    def test_receptionist_can_book_and_cancel(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('appointments:book')).status_code, 200)
        self.assertEqual(self.client.get(reverse('appointments:cancel', args=[self.appointment.pk])).status_code, 200)

    def test_receptionist_cannot_complete(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('appointments:complete', args=[self.appointment.pk])).status_code, 403)

    def test_doctor_can_complete_own_only(self):
        doctor = self.doctor
        self.client.force_login(doctor.user)
        self.assertEqual(self.client.get(reverse('appointments:complete', args=[self.appointment.pk])).status_code, 200)

        other_appt = create_appointment(
            create_patient(full_name='Other Patient'),
            create_doctor(create_doctor_user(username='other_doc')),
        )
        self.assertEqual(self.client.get(reverse('appointments:complete', args=[other_appt.pk])).status_code, 403)
