from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from hospital.tests_utils import (
    create_admin, create_doctor, create_doctor_user, create_patient, create_receptionist,
)
from laboratory.models import LabTestItem, LabTestOrder, LabTestType
from notifications.models import Notification


def make_test_type(name, code=None, category='blood', price='50', **kwargs):
    return LabTestType.objects.create(
        name=name,
        code=code or name.upper(),
        category=category,
        price=price,
        **kwargs,
    )


def order_post_data(patient, doctor, test_types, notes=''):
    return {
        'patient': patient.pk,
        'doctor': doctor.pk if doctor else '',
        'appointment': '',
        'clinical_notes': notes,
        'test_types': [str(t.pk) for t in test_types],
    }


class LabTestOrderModelTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.test_type = make_test_type('CBC', 'CBC', price='75')

    def test_order_number_format(self):
        order = LabTestOrder.objects.create(patient=self.patient)
        year = timezone.localdate().year
        self.assertRegex(order.order_no, rf'^LAB-{year}-\d{{4}}$')

    def test_order_numbers_increment(self):
        first = LabTestOrder.objects.create(patient=self.patient)
        second = LabTestOrder.objects.create(patient=self.patient)
        year = timezone.localdate().year
        self.assertEqual(first.order_no, f'LAB-{year}-0001')
        self.assertEqual(second.order_no, f'LAB-{year}-0002')

    def test_total_sums_item_prices(self):
        order = LabTestOrder.objects.create(patient=self.patient)
        LabTestItem.objects.create(order=order, test_type=make_test_type('X-Ray', 'XRAY', price='120'))
        LabTestItem.objects.create(order=order, test_type=make_test_type('Uric', 'URIC', price='30'))
        self.assertEqual(order.total, Decimal('150.00'))


class LabTestItemWorkflowTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.user = create_admin()
        self.order = LabTestOrder.objects.create(patient=self.patient)

    def test_mark_completed_sets_fields_and_completes_order(self):
        item = LabTestItem.objects.create(order=self.order, test_type=make_test_type('CBC', price='75'))
        item.mark_completed(self.user, '5.2', 'Within range', 'CBC-001')
        item.refresh_from_db()
        self.assertEqual(item.status, LabTestItem.Status.COMPLETED)
        self.assertEqual(item.result, '5.2')
        self.assertEqual(item.completed_by, self.user)
        self.assertIsNotNone(item.completed_at)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, LabTestOrder.Status.COMPLETED)

    def test_order_stays_in_progress_with_pending_items(self):
        item = LabTestItem.objects.create(order=self.order, test_type=make_test_type('CBC', price='75'))
        LabTestItem.objects.create(order=self.order, test_type=make_test_type('X-Ray', 'XRAY', price='120'))
        item.mark_completed(self.user, '5.2', '')
        self.order.refresh_from_db()
        self.assertNotEqual(self.order.status, LabTestOrder.Status.COMPLETED)

    def test_mark_completed_saves_reference_range(self):
        item = LabTestItem.objects.create(order=self.order, test_type=make_test_type('CBC', price='75'))
        item.mark_completed(self.user, '5.2', '', '4.0-10.0')
        item.refresh_from_db()
        self.assertEqual(item.reference_range, '4.0-10.0')


class LabTestOrderCreateTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.receptionist = create_receptionist()
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.doctor = create_doctor(create_doctor_user())
        self.cbc = make_test_type('CBC', 'CBC', price='75')
        self.xray = make_test_type('X-Ray', 'XRAY', price='120')

    def test_admin_can_create_order_with_items(self):
        response = self.client.post(
            reverse('laboratory:order_create'),
            order_post_data(self.patient, self.doctor, [self.cbc, self.xray]),
        )
        self.assertRedirects(response, reverse('laboratory:order_list'))
        order = LabTestOrder.objects.get()
        self.assertEqual(order.patient, self.patient)
        self.assertEqual(order.doctor, self.doctor)
        self.assertEqual(order.ordered_by, self.admin)
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(order.total, Decimal('195.00'))
        year = timezone.localdate().year
        self.assertRegex(order.order_no, rf'^LAB-{year}-\d{{4}}$')

    def test_create_fires_notifications(self):
        baseline_admin = Notification.objects.filter(recipient=self.admin).count()
        baseline_receptionist = Notification.objects.filter(recipient=self.receptionist).count()
        self.client.post(
            reverse('laboratory:order_create'),
            order_post_data(self.patient, self.doctor, [self.cbc]),
        )
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), baseline_admin + 1)
        self.assertEqual(Notification.objects.filter(recipient=self.receptionist).count(), baseline_receptionist + 1)

    def test_doctor_can_create_order(self):
        self.client.force_login(self.doctor.user)
        response = self.client.post(
            reverse('laboratory:order_create'),
            order_post_data(self.patient, self.doctor, [self.cbc]),
        )
        self.assertRedirects(response, reverse('laboratory:order_list'))
        order = LabTestOrder.objects.get()
        self.assertEqual(order.ordered_by, self.doctor.user)
        self.assertEqual(order.doctor, self.doctor)

    def test_receptionist_cannot_create_order(self):
        self.client.force_login(self.receptionist)
        self.assertEqual(self.client.get(reverse('laboratory:order_create')).status_code, 403)


class LabOrderRoleGuardTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.doctor_a = create_doctor(create_doctor_user(username='doc_a'))
        self.doctor_b = create_doctor(create_doctor_user(username='doc_b'))
        self.patient = create_patient()
        self.cbc = make_test_type('CBC', price='75')

    def make_order(self, doctor=None):
        order = LabTestOrder.objects.create(patient=self.patient, doctor=doctor)
        LabTestItem.objects.create(order=order, test_type=self.cbc)
        return order

    def test_doctor_sees_only_own_orders(self):
        self.client.force_login(self.admin)
        self.make_order(doctor=self.doctor_a)
        self.make_order(doctor=self.doctor_b)

        self.client.force_login(self.doctor_a.user)
        response = self.client.get(reverse('laboratory:order_list'))
        self.assertEqual(list(response.context['orders']), [LabTestOrder.objects.get(doctor=self.doctor_a)])

    def test_admin_sees_all_orders(self):
        self.client.force_login(self.admin)
        self.make_order(doctor=self.doctor_a)
        self.make_order(doctor=self.doctor_b)
        response = self.client.get(reverse('laboratory:order_list'))
        self.assertEqual(response.context['orders'].count(), 2)

    def test_type_crud_admin_only(self):
        test_type = self.cbc
        self.client.force_login(self.doctor_a.user)
        self.assertEqual(self.client.get(reverse('laboratory:type_add')).status_code, 403)
        self.assertEqual(self.client.get(reverse('laboratory:type_edit', args=[test_type.pk])).status_code, 403)
        self.assertEqual(self.client.get(reverse('laboratory:type_delete', args=[test_type.pk])).status_code, 403)

    def test_type_list_visible_to_admin_and_doctor(self):
        self.client.force_login(self.doctor_a.user)
        self.assertEqual(self.client.get(reverse('laboratory:type_list')).status_code, 200)
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(reverse('laboratory:type_list')).status_code, 200)

    def test_receptionist_cannot_view_types(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('laboratory:type_list')).status_code, 403)

    def test_cancel_order_admin_only_and_cancels_items(self):
        order = self.make_order(doctor=self.doctor_a)
        self.client.force_login(self.doctor_a.user)
        self.assertEqual(
            self.client.post(reverse('laboratory:order_cancel', args=[order.pk])).status_code, 403,
        )
        self.client.force_login(self.admin)
        response = self.client.post(reverse('laboratory:order_cancel', args=[order.pk]))
        self.assertRedirects(response, reverse('laboratory:order_detail', args=[order.pk]))
        order.refresh_from_db()
        self.assertEqual(order.status, LabTestOrder.Status.CANCELLED)
        self.assertEqual(order.items.filter(status=LabTestItem.Status.CANCELLED).count(), order.items.count())

    def test_item_cancel_admin_only(self):
        order = self.make_order(doctor=self.doctor_a)
        item = order.items.get()
        self.client.force_login(self.doctor_a.user)
        self.assertEqual(
            self.client.post(reverse('laboratory:item_cancel', args=[item.pk])).status_code, 403,
        )
        self.client.force_login(self.admin)
        self.assertRedirects(
            self.client.post(reverse('laboratory:item_cancel', args=[item.pk])),
            reverse('laboratory:order_detail', args=[order.pk]),
        )


class LabResultEntryTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.doctor = create_doctor(create_doctor_user())
        self.client.force_login(self.doctor.user)
        self.patient = create_patient()
        self.order = LabTestOrder.objects.create(patient=self.patient, doctor=self.doctor)
        self.item = LabTestItem.objects.create(
            order=self.order, test_type=make_test_type('CBC', price='75', reference_range='4-10'),
        )

    def result_post_data(self):
        return {'result': '5.2', 'reference_range': '4-10', 'notes': 'Reviewed'}

    def test_doctor_entering_result_completes_item(self):
        response = self.client.post(reverse('laboratory:item_result', args=[self.item.pk]), self.result_post_data())
        self.assertRedirects(response, reverse('laboratory:order_detail', args=[self.order.pk]))
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, LabTestItem.Status.COMPLETED)
        self.assertEqual(self.item.result, '5.2')
        self.assertEqual(self.item.completed_by, self.doctor.user)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, LabTestOrder.Status.COMPLETED)

    def test_result_entry_fires_notifications(self):
        baseline_doctor = Notification.objects.filter(recipient=self.doctor.user).count()
        baseline_admin = Notification.objects.filter(recipient=self.admin).count()
        self.client.post(reverse('laboratory:item_result', args=[self.item.pk]), self.result_post_data())
        self.assertEqual(Notification.objects.filter(recipient=self.doctor.user).count(), baseline_doctor + 1)
        self.assertEqual(Notification.objects.filter(recipient=self.admin).count(), baseline_admin + 1)

    def test_result_entry_saves_reference_range(self):
        self.client.post(reverse('laboratory:item_result', args=[self.item.pk]), {
            'result': '5.2', 'reference_range': '3.5-9.5', 'notes': '',
        })
        self.item.refresh_from_db()
        self.assertEqual(self.item.reference_range, '3.5-9.5')

    def test_receptionist_cannot_enter_result(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(
            self.client.get(reverse('laboratory:item_result', args=[self.item.pk])).status_code, 403,
        )
