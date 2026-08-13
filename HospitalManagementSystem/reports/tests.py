from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from admissions.models import Admission, Room
from appointments.models import Appointment
from billing.models import Invoice, InvoiceItem
from hospital.tests_utils import (
    create_admin, create_appointment, create_doctor, create_doctor_user,
    create_patient, create_receptionist,
)
from laboratory.models import LabTestOrder
from pharmacy.models import Medicine, Prescription


def make_invoice(patient, paid=0, status='pending', method='cash', unit_price=200):
    invoice = Invoice.objects.create(
        patient=patient,
        paid_amount=paid,
        status='pending',
        payment_method=method,
        tax=Decimal('0'),
    )
    InvoiceItem.objects.create(invoice=invoice, description='Consultation', quantity=1, unit_price=unit_price)
    if status == 'paid':
        invoice.status = status
        invoice.save()
    else:
        invoice.status = status
        invoice.save(update_fields=['status'])
    return invoice


class FinancialReportTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.patient = create_patient()

    def test_financial_metrics(self):
        make_invoice(self.patient, status='paid', method='cash', unit_price=200)
        make_invoice(self.patient, status='partial', paid=50, method='card', unit_price=100)
        make_invoice(self.patient, status='cancelled', method='online', unit_price=300)

        response = self.client.get(reverse('reports:financial'))
        ctx = response.context
        self.assertEqual(ctx['total_billed'], Decimal('300.00'))
        self.assertEqual(ctx['total_collected'], Decimal('250.00'))
        self.assertEqual(ctx['outstanding'], Decimal('50.00'))
        self.assertEqual(ctx['invoice_count'], 2)
        self.assertEqual(ctx['cancelled_count'], 1)
        method_totals = {m['label']: m['total'] for m in ctx['payment_breakdown']}
        self.assertEqual(method_totals['Cash'], Decimal('200.00'))
        self.assertEqual(method_totals['Card'], Decimal('50.00'))

    def test_financial_date_filter(self):
        make_invoice(self.patient, status='paid', unit_price=100)
        response = self.client.get(reverse('reports:financial'), {
            'start_date': '2030-01-01',
            'end_date': '2030-12-31',
        })
        self.assertEqual(response.context['invoice_count'], 0)

    def test_financial_export_csv(self):
        make_invoice(self.patient, status='paid', unit_price=100)
        response = self.client.get(reverse('reports:financial_export'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        content = response.content.decode()
        self.assertIn('Invoice No', content)
        self.assertIn('INV-', content)

    def test_doctor_cannot_view_financial(self):
        doctor = create_doctor(create_doctor_user())
        self.client.force_login(doctor.user)
        self.assertEqual(self.client.get(reverse('reports:financial')).status_code, 403)
        self.assertEqual(self.client.get(reverse('reports:financial_export')).status_code, 403)


class ClinicalReportTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.doctor_user = self.doctor.user

    def test_clinical_metrics(self):
        today = timezone.localdate()
        create_appointment(self.patient, self.doctor, on_date=today, status=Appointment.Status.COMPLETED)
        create_appointment(self.patient, self.doctor, on_date=today, status=Appointment.Status.SCHEDULED)
        Prescription.objects.create(patient=self.patient, doctor=self.doctor)
        LabTestOrder.objects.create(patient=self.patient, doctor=self.doctor)

        response = self.client.get(reverse('reports:clinical'))
        ctx = response.context
        self.assertEqual(ctx['appointment_count'], 2)
        self.assertEqual(ctx['appointment_status']['Completed'], 1)
        self.assertEqual(ctx['appointment_status']['Scheduled'], 1)
        self.assertEqual(ctx['prescription_count'], 1)
        self.assertEqual(ctx['lab_order_count'], 1)

    def test_doctor_can_view_clinical(self):
        self.client.force_login(self.doctor_user)
        self.assertEqual(self.client.get(reverse('reports:clinical')).status_code, 200)

    def test_receptionist_cannot_view_clinical(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('reports:clinical')).status_code, 403)

    def test_clinical_export_csv(self):
        create_appointment(
            self.patient, self.doctor, on_date=timezone.localdate(), status=Appointment.Status.COMPLETED,
        )
        self.client.force_login(self.doctor_user)
        response = self.client.get(reverse('reports:clinical_export'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn(self.patient.full_name, response.content.decode())


class OperationsReportTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)

    def test_operations_metrics(self):
        patient = create_patient()
        room = Room.objects.create(room_number='101', room_type='private', capacity=1, rate_per_day=100)
        Admission.objects.create(patient=patient, room=room)
        room.refresh_status()
        Medicine.objects.create(name='Paracetamol', stock_quantity=5, reorder_level=10, price=2)
        Medicine.objects.create(name='Insulin', stock_quantity=50, reorder_level=10, price=20)

        response = self.client.get(reverse('reports:operations'))
        ctx = response.context
        self.assertEqual(ctx['occupied_beds'], 1)
        self.assertEqual(ctx['total_capacity'], 1)
        self.assertEqual(ctx['occupancy_rate'], 100)
        self.assertEqual(ctx['low_stock_count'], 1)
        self.assertEqual(ctx['stock_value'], Decimal('1010.00'))
        self.assertEqual(ctx['active_admissions'], 1)

    def test_operations_admin_only(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('reports:operations')).status_code, 403)
        self.assertEqual(self.client.get(reverse('reports:operations_export')).status_code, 403)
        doctor = create_doctor(create_doctor_user())
        self.client.force_login(doctor.user)
        self.assertEqual(self.client.get(reverse('reports:operations')).status_code, 403)

    def test_operations_export_csv(self):
        Room.objects.create(room_number='101', room_type='private', capacity=1, rate_per_day=100)
        response = self.client.get(reverse('reports:operations_export'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('101', response.content.decode())


class ReportIndexTests(TestCase):
    def test_index_visible_to_all_staff(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('reports:index')).status_code, 200)
