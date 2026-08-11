from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from appointments.models import Appointment
from billing.models import Invoice, InvoiceItem
from hospital.tests_utils import (
    create_admin, create_appointment, create_doctor, create_doctor_user,
    create_patient, create_receptionist,
)
from notifications.models import Notification


class InvoiceModelTests(TestCase):
    def setUp(self):
        self.patient = create_patient()

    def test_invoice_number_format(self):
        invoice = Invoice.objects.create(patient=self.patient)
        year = timezone.localdate().year
        self.assertRegex(invoice.invoice_no, rf'^INV-{year}-\d{{4}}$')

    def test_invoice_numbers_increment(self):
        first = Invoice.objects.create(patient=self.patient)
        second = Invoice.objects.create(patient=self.patient)
        year = timezone.localdate().year
        self.assertEqual(first.invoice_no, f'INV-{year}-0001')
        self.assertEqual(second.invoice_no, f'INV-{year}-0002')

    def test_totals_with_discount_and_tax(self):
        invoice = Invoice.objects.create(patient=self.patient, discount=Decimal('10'), tax=Decimal('5'))
        InvoiceItem.objects.create(invoice=invoice, description='Consultation', quantity=2, unit_price=Decimal('100'))
        InvoiceItem.objects.create(invoice=invoice, description='X-Ray', quantity=1, unit_price=Decimal('50'))
        self.assertEqual(invoice.subtotal, Decimal('250.00'))
        self.assertEqual(invoice.total, Decimal('245.00'))
        self.assertEqual(invoice.balance, Decimal('245.00'))

    def test_status_paid_auto_sets_paid_amount(self):
        invoice = Invoice.objects.create(patient=self.patient)
        InvoiceItem.objects.create(invoice=invoice, description='Visit', quantity=1, unit_price=Decimal('120'))
        invoice.status = Invoice.Status.PAID
        invoice.save()
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, Decimal('120.00'))


def items_post_data(patient, appointment, discount='10', tax='5', rows=2):
    data = {
        'patient': patient.pk,
        'appointment': appointment.pk,
        'discount': discount,
        'tax': tax,
        'due_date': '',
        'notes': '',
        'payment_method': 'cash',
        'items-TOTAL_FORMS': str(3),
        'items-INITIAL_FORMS': '0',
        'items-MIN_NUM_FORMS': '0',
        'items-MAX_NUM_FORMS': '1000',
    }
    descriptions = ['Consultation', 'X-Ray'] + ['' for _ in range(3 - rows)]
    quantities = ['2', '1'] + ['' for _ in range(3 - rows)]
    unit_prices = ['100', '50'] + ['' for _ in range(3 - rows)]
    for i in range(3):
        data[f'items-{i}-description'] = descriptions[i]
        data[f'items-{i}-quantity'] = quantities[i]
        data[f'items-{i}-unit_price'] = unit_prices[i]
        data[f'items-{i}-DELETE'] = ''
    return data


class InvoiceCreateTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.completed = create_appointment(
            self.patient, self.doctor, status=Appointment.Status.COMPLETED,
        )
        self.scheduled = create_appointment(
            self.patient, self.doctor, status=Appointment.Status.SCHEDULED,
        )
        self.receptionist = create_receptionist()

    def test_create_invoice_with_items_and_blank_rows(self):
        response = self.client.post(reverse('billing:create'), items_post_data(self.patient, self.completed))
        self.assertRedirects(response, reverse('billing:list'))
        invoice = Invoice.objects.get()
        self.assertEqual(invoice.patient, self.patient)
        self.assertEqual(invoice.appointment, self.completed)
        self.assertEqual(invoice.items.count(), 2)
        self.assertEqual(invoice.subtotal, Decimal('250.00'))
        self.assertEqual(invoice.total, Decimal('245.00'))
        self.assertEqual(invoice.created_by, self.admin)

    def test_invoice_create_fires_notifications(self):
        baseline_admin = Notification.objects.filter(recipient=self.admin).count()
        baseline_receptionist = Notification.objects.filter(recipient=self.receptionist).count()
        self.client.post(reverse('billing:create'), items_post_data(self.patient, self.completed))
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), baseline_admin + 1)
        self.assertEqual(Notification.objects.filter(recipient=self.receptionist).count(), baseline_receptionist + 1)

    def test_create_prefills_from_completed_appointment(self):
        response = self.client.get(reverse('billing:create'), {'appointment': self.completed.pk})
        initial = response.context['form'].initial
        self.assertEqual(initial['appointment'], self.completed)
        self.assertEqual(initial['patient'], self.patient)

    def test_create_ignores_non_completed_appointment(self):
        response = self.client.get(reverse('billing:create'), {'appointment': self.scheduled.pk})
        self.assertNotIn('appointment', response.context['form'].initial)


class InvoicePayTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.invoice = Invoice.objects.create(patient=create_patient(), tax=Decimal('0'))
        InvoiceItem.objects.create(
            invoice=self.invoice, description='Consultation', quantity=1, unit_price=Decimal('200'),
        )
        self.total = self.invoice.total

    def pay(self, amount):
        return self.client.post(reverse('billing:pay', args=[self.invoice.pk]), {
            'paid_amount': str(amount),
            'payment_method': 'cash',
        })

    def test_full_payment_marks_paid(self):
        response = self.pay(self.total)
        self.assertRedirects(response, reverse('billing:detail', args=[self.invoice.pk]))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)
        self.assertEqual(self.invoice.paid_amount, self.total)

    def test_partial_payments_accumulate(self):
        self.pay(Decimal('50.00'))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PARTIAL)
        self.assertEqual(self.invoice.paid_amount, Decimal('50.00'))

        self.pay(Decimal('100.00'))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PARTIAL)
        self.assertEqual(self.invoice.paid_amount, Decimal('150.00'))
        self.assertEqual(self.invoice.balance, Decimal('50.00'))

    def test_cannot_pay_settled_invoice(self):
        self.invoice.paid_amount = self.total
        self.invoice.status = Invoice.Status.PAID
        self.invoice.save()
        self.pay(Decimal('10.00'))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)
        self.assertEqual(self.invoice.paid_amount, self.total)

    def test_invalid_amount_rerenders_form(self):
        response = self.pay('not-a-number')
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid_amount, Decimal('0.00'))


class InvoiceRoleGuardTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.invoice = Invoice.objects.create(patient=self.patient)

    def test_receptionist_can_create_and_pay(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('billing:create')).status_code, 200)
        self.assertEqual(self.client.get(reverse('billing:pay', args=[self.invoice.pk])).status_code, 200)

    def test_receptionist_cannot_edit_cancel_delete(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('billing:edit', args=[self.invoice.pk])).status_code, 403)
        self.assertEqual(self.client.get(reverse('billing:cancel', args=[self.invoice.pk])).status_code, 403)
        self.assertEqual(self.client.get(reverse('billing:delete', args=[self.invoice.pk])).status_code, 403)

    def test_doctor_cannot_access_billing(self):
        self.client.force_login(self.doctor.user)
        self.assertEqual(self.client.get(reverse('billing:list')).status_code, 403)
        self.assertEqual(self.client.get(reverse('billing:create')).status_code, 403)

    def test_admin_can_edit_cancel_delete(self):
        self.client.force_login(create_admin())
        self.assertEqual(self.client.get(reverse('billing:edit', args=[self.invoice.pk])).status_code, 200)
        self.assertEqual(self.client.get(reverse('billing:cancel', args=[self.invoice.pk])).status_code, 200)
        self.assertEqual(self.client.get(reverse('billing:delete', args=[self.invoice.pk])).status_code, 200)


class InvoiceExportTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        Invoice.objects.create(patient=self.patient)

    def test_admin_can_export(self):
        self.client.force_login(create_admin())
        response = self.client.get(reverse('billing:export'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')

    def test_doctor_cannot_export(self):
        doctor = create_doctor(create_doctor_user(username='export_doc'))
        self.client.force_login(doctor.user)
        self.assertEqual(self.client.get(reverse('billing:export')).status_code, 403)
