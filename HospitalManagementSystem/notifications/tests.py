from django.test import TestCase
from django.urls import reverse

from appointments.models import Appointment
from billing.models import Invoice
from hospital.tests_utils import (
    create_admin, create_appointment, create_doctor, create_doctor_user,
    create_patient, create_receptionist,
)
from notifications.models import Notification


class AppointmentNotificationTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.receptionist = create_receptionist()
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.assertEqual(Notification.objects.count(), 0)

    def test_booking_notifies_doctor_and_admins(self):
        create_appointment(self.patient, self.doctor)
        self.assertEqual(Notification.objects.filter(recipient=self.doctor.user).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.receptionist).count(), 0)
        notification = Notification.objects.filter(recipient=self.doctor.user).get()
        self.assertIn(self.patient.full_name, notification.message)
        self.assertIsNotNone(notification.link)

    def test_cancel_notifies_admins_only(self):
        appointment = create_appointment(self.patient, self.doctor)
        appointment.status = Appointment.Status.CANCELLED
        appointment.save()
        self.assertEqual(Notification.objects.filter(recipient=self.doctor.user).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), 2)
        self.assertEqual(Notification.objects.filter(recipient=self.receptionist).count(), 0)

    def test_inactive_doctor_not_notified(self):
        inactive = create_doctor_user(username='inactive_doc')
        inactive.is_active = False
        inactive.save()
        create_doctor(inactive)
        create_appointment(self.patient, self.doctor)
        self.assertFalse(Notification.objects.filter(recipient=inactive).exists())


class InvoiceNotificationTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.receptionist = create_receptionist()
        self.patient = create_patient()
        self.assertEqual(Notification.objects.count(), 0)

    def test_invoice_creation_notifies_admins_and_receptionists(self):
        invoice = Invoice.objects.create(patient=self.patient)
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.receptionist).count(), 1)
        message = Notification.objects.filter(recipient=self.admin).get().message
        self.assertIn(invoice.invoice_no, message)
        self.assertIn(self.patient.full_name, message)

    def test_invoice_update_does_not_re_notify(self):
        invoice = Invoice.objects.create(patient=self.patient)
        invoice.notes = 'Updated'
        invoice.save()
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), 1)


class NotificationViewTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.unread = Notification.objects.create(
            recipient=self.admin, title='Unread', message='Hello', link='/appointments/',
        )
        self.read = Notification.objects.create(
            recipient=self.admin, title='Read', is_read=True,
        )

    def test_list_shows_unread_count(self):
        response = self.client.get(reverse('notifications:list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['unread_count'], 1)
        self.assertContains(response, 'Unread')

    def test_mark_read_redirects_to_link(self):
        response = self.client.post(reverse('notifications:mark_read', args=[self.unread.pk]))
        self.assertRedirects(response, '/appointments/', fetch_redirect_response=False)
        self.unread.refresh_from_db()
        self.assertTrue(self.unread.is_read)

    def test_mark_all_read(self):
        response = self.client.post(reverse('notifications:mark_all_read'))
        self.assertRedirects(response, reverse('notifications:list'))
        self.unread.refresh_from_db()
        self.read.refresh_from_db()
        self.assertTrue(self.unread.is_read)
        self.assertTrue(self.read.is_read)

    def test_cannot_mark_another_users_notification(self):
        other_user_notification = Notification.objects.create(
            recipient=create_receptionist(), title='Private',
        )
        response = self.client.post(reverse('notifications:mark_read', args=[other_user_notification.pk]))
        self.assertEqual(response.status_code, 404)
        other_user_notification.refresh_from_db()
        self.assertFalse(other_user_notification.is_read)
