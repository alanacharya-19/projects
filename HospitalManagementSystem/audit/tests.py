from django.test import TestCase
from django.urls import reverse

from audit.models import AuditLog
from hospital.tests_utils import create_admin, create_doctor_user, create_patient, create_receptionist
from pharmacy.models import Medicine


class AuditSignalTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)

    def test_create_via_request_is_logged(self):
        self.client.post(reverse('pharmacy:medicine_add'), {
            'name': 'Paracetamol',
            'generic_name': '',
            'category': 'tablet',
            'unit': 'tablet',
            'price': '2.5',
            'stock_quantity': '20',
            'reorder_level': '5',
            'batch_number': '',
            'expiry_date': '',
            'supplier': '',
            'is_active': 'on',
        })
        log = AuditLog.objects.get(model_name='medicine')
        self.assertEqual(log.action, AuditLog.Action.CREATED)
        self.assertEqual(log.user, self.admin)
        self.assertIn('Paracetamol', log.object_repr)
        self.assertIn('/pharmacy/medicines/add/', log.request_path)

    def test_update_via_request_is_logged(self):
        medicine = Medicine.objects.create(name='Aspirin', stock_quantity=10)
        self.client.post(reverse('pharmacy:medicine_edit', args=[medicine.pk]), {
            'name': 'Aspirin 500',
            'generic_name': '',
            'category': 'tablet',
            'unit': 'tablet',
            'price': '3',
            'stock_quantity': '15',
            'reorder_level': '5',
            'batch_number': '',
            'expiry_date': '',
            'supplier': '',
            'is_active': 'on',
        })
        log = AuditLog.objects.get(model_name='medicine', action=AuditLog.Action.UPDATED)
        self.assertEqual(log.object_repr, 'Aspirin 500')

    def test_delete_via_request_is_logged(self):
        medicine = Medicine.objects.create(name='Ibuprofen', stock_quantity=10)
        self.client.post(reverse('pharmacy:medicine_delete', args=[medicine.pk]))
        log = AuditLog.objects.get(model_name='medicine', action=AuditLog.Action.DELETED)
        self.assertEqual(log.object_id, str(medicine.pk))

    def test_no_request_no_log(self):
        Medicine.objects.create(name='WithoutRequest', stock_quantity=10)
        self.assertEqual(AuditLog.objects.filter(model_name='medicine').count(), 0)

    def test_excluded_models_are_not_logged(self):
        patient = create_patient()
        from laboratory.models import LabTestOrder
        self.client.post(reverse('laboratory:order_create'), {
            'patient': patient.pk,
            'doctor': '',
            'appointment': '',
            'clinical_notes': '',
            'test_types': '',
        })
        self.assertFalse(AuditLog.objects.filter(model_name='notification').exists())


class AuditListViewTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)

    def make_logs(self):
        AuditLog.objects.create(
            user=self.admin, action=AuditLog.Action.CREATED,
            app_label='patients', model_name='patient', object_id='1', object_repr='John Carter',
        )
        AuditLog.objects.create(
            user=self.admin, action=AuditLog.Action.DELETED,
            app_label='patients', model_name='patient', object_id='2', object_repr='Jane Roe',
        )

    def test_admin_can_view_log(self):
        self.make_logs()
        response = self.client.get(reverse('audit:list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['logs'].count(), 2)

    def test_non_admin_cannot_view_log(self):
        self.client.force_login(create_doctor_user())
        self.assertEqual(self.client.get(reverse('audit:list')).status_code, 403)
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('audit:list')).status_code, 403)

    def test_action_filter(self):
        self.make_logs()
        response = self.client.get(reverse('audit:list'), {'action': 'deleted'})
        self.assertEqual(response.context['logs'].count(), 1)
        self.assertEqual(response.context['logs'][0].action, 'deleted')

    def test_model_choices_from_data(self):
        self.make_logs()
        response = self.client.get(reverse('audit:list'))
        self.assertIn('patient', response.context['model_choices'])
