from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from hospital.tests_utils import (
    create_admin, create_doctor, create_doctor_user, create_patient, create_receptionist,
)
from pharmacy.models import Medicine, Prescription, PrescriptionItem, StockMovement


def make_medicine(name='Paracetamol', stock=10, reorder=5, price='2.50'):
    return Medicine.objects.create(
        name=name,
        stock_quantity=stock,
        reorder_level=reorder,
        price=price,
        unit='tablet',
    )


def prescription_post_data(patient, medicines, extra_rows=3):
    data = {
        'patient': patient.pk,
        'medical_record': '',
        'status': 'active',
        'notes': '',
        'items-TOTAL_FORMS': str(len(medicines) + extra_rows),
        'items-INITIAL_FORMS': '0',
        'items-MIN_NUM_FORMS': '0',
        'items-MAX_NUM_FORMS': '1000',
    }
    for i, medicine in enumerate(medicines):
        data.update({
            f'items-{i}-medicine': medicine.pk,
            f'items-{i}-dosage': '1 tablet',
            f'items-{i}-frequency': 'twice daily',
            f'items-{i}-duration_days': 5,
            f'items-{i}-quantity': 10,
            f'items-{i}-instructions': 'after meals',
            f'items-{i}-DELETE': '',
        })
    for i in range(len(medicines), len(medicines) + extra_rows):
        data.update({
            f'items-{i}-medicine': '',
            f'items-{i}-dosage': '',
            f'items-{i}-frequency': '',
            f'items-{i}-duration_days': '',
            f'items-{i}-quantity': '',
            f'items-{i}-instructions': '',
            f'items-{i}-DELETE': '',
        })
    return data


class MedicineModelTests(TestCase):
    def test_is_low_stock(self):
        low = make_medicine(stock=5, reorder=10)
        fine = make_medicine(name='Aspirin', stock=20, reorder=10)
        self.assertTrue(low.is_low_stock)
        self.assertFalse(fine.is_low_stock)

    def test_stock_value(self):
        medicine = make_medicine(stock=10, price='2.50')
        self.assertEqual(medicine.stock_value, Decimal('25.00'))


class MedicineViewTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_login(self.admin)
        self.medicine = make_medicine()

    def test_admin_can_add_medicine(self):
        response = self.client.post(reverse('pharmacy:medicine_add'), {
            'name': 'Ibuprofen',
            'generic_name': '',
            'category': 'tablet',
            'unit': 'tablet',
            'price': '5',
            'stock_quantity': '20',
            'reorder_level': '5',
            'batch_number': 'B-1',
            'expiry_date': '',
            'supplier': '',
            'is_active': 'on',
        })
        self.assertRedirects(response, reverse('pharmacy:medicine_list'))
        self.assertTrue(Medicine.objects.filter(name='Ibuprofen').exists())

    def test_medicine_crud_admin_only(self):
        self.client.force_login(create_doctor_user(username='med_doc'))
        self.assertEqual(self.client.get(reverse('pharmacy:medicine_add')).status_code, 403)
        self.assertEqual(self.client.get(reverse('pharmacy:medicine_edit', args=[self.medicine.pk])).status_code, 403)
        self.assertEqual(self.client.get(reverse('pharmacy:medicine_delete', args=[self.medicine.pk])).status_code, 403)

    def test_medicine_list_visible_to_staff(self):
        self.client.force_login(create_receptionist())
        self.assertEqual(self.client.get(reverse('pharmacy:medicine_list')).status_code, 200)

    def test_stock_adjust_adds_quantity_and_logs_movement(self):
        self.client.post(reverse('pharmacy:medicine_stock', args=[self.medicine.pk]), {
            'quantity': '15',
            'reason': 'New shipment received',
        })
        self.medicine.refresh_from_db()
        self.assertEqual(self.medicine.stock_quantity, 25)
        movement = StockMovement.objects.get(medicine=self.medicine)
        self.assertEqual(movement.quantity, 15)
        self.assertEqual(movement.user, self.admin)


class PrescriptionModelTests(TestCase):
    def setUp(self):
        self.patient = create_patient()
        self.user = create_admin()
        self.medicine = make_medicine(stock=10)
        self.prescription = Prescription.objects.create(patient=self.patient)
        self.item = PrescriptionItem.objects.create(
            prescription=self.prescription, medicine=self.medicine, quantity=4, duration_days=3,
        )

    def test_prescription_number_format(self):
        year = timezone.localdate().year
        self.assertRegex(self.prescription.prescription_no, rf'^RX-{year}-\d{{4}}$')

    def test_dispense_decrements_stock(self):
        self.prescription.dispense(self.user)
        self.prescription.refresh_from_db()
        self.medicine.refresh_from_db()
        self.assertEqual(self.prescription.status, Prescription.Status.DISPENSED)
        self.assertEqual(self.medicine.stock_quantity, 6)
        movement = StockMovement.objects.get(medicine=self.medicine)
        self.assertEqual(movement.quantity, -4)

    def test_dispense_insufficient_stock_raises(self):
        PrescriptionItem.objects.create(
            prescription=self.prescription, medicine=self.medicine, quantity=20, duration_days=3,
        )
        with self.assertRaises(ValueError):
            self.prescription.dispense(self.user)


class PrescriptionViewTests(TestCase):
    def setUp(self):
        self.admin = create_admin()
        self.doctor = create_doctor(create_doctor_user())
        self.client.force_login(self.admin)
        self.patient = create_patient()
        self.medicine = make_medicine(stock=20)

    def test_admin_can_create_prescription_with_items(self):
        response = self.client.post(
            reverse('pharmacy:prescription_create'),
            prescription_post_data(self.patient, [self.medicine]),
        )
        self.assertRedirects(response, reverse('pharmacy:prescription_list'))
        prescription = Prescription.objects.get()
        self.assertEqual(prescription.patient, self.patient)
        self.assertEqual(prescription.created_by, self.admin)
        self.assertEqual(prescription.items.count(), 1)
        self.assertEqual(prescription.items.first().medicine, self.medicine)

    def test_doctor_can_create_prescription(self):
        self.client.force_login(self.doctor.user)
        response = self.client.post(
            reverse('pharmacy:prescription_create'),
            prescription_post_data(self.patient, [self.medicine]),
        )
        self.assertRedirects(response, reverse('pharmacy:prescription_list'))
        prescription = Prescription.objects.get()
        self.assertEqual(prescription.doctor, self.doctor)
        self.assertEqual(prescription.created_by, self.doctor.user)

    def test_doctor_sees_only_own_prescriptions(self):
        doctor_b = create_doctor(create_doctor_user(username='rx_doc_b'))
        Prescription.objects.create(patient=self.patient, doctor=self.doctor)
        Prescription.objects.create(patient=self.patient, doctor=doctor_b)
        self.client.force_login(self.doctor.user)
        response = self.client.get(reverse('pharmacy:prescription_list'))
        self.assertEqual(response.context['prescriptions'].count(), 1)

    def test_dispense_updates_stock_via_view(self):
        prescription = Prescription.objects.create(patient=self.patient)
        PrescriptionItem.objects.create(
            prescription=prescription, medicine=self.medicine, quantity=4, duration_days=3,
        )
        self.client.post(reverse('pharmacy:prescription_dispense', args=[prescription.pk]))
        prescription.refresh_from_db()
        self.medicine.refresh_from_db()
        self.assertEqual(prescription.status, Prescription.Status.DISPENSED)
        self.assertEqual(self.medicine.stock_quantity, 16)

    def test_doctor_cannot_dispense(self):
        prescription = Prescription.objects.create(patient=self.patient)
        self.client.force_login(self.doctor.user)
        self.assertEqual(
            self.client.post(reverse('pharmacy:prescription_dispense', args=[prescription.pk])).status_code, 403,
        )

    def test_delete_admin_only(self):
        prescription = Prescription.objects.create(patient=self.patient)
        self.client.force_login(self.doctor.user)
        self.assertEqual(
            self.client.get(reverse('pharmacy:prescription_delete', args=[prescription.pk])).status_code, 403,
        )
        self.client.force_login(self.admin)
        self.assertRedirects(
            self.client.post(reverse('pharmacy:prescription_delete', args=[prescription.pk])),
            reverse('pharmacy:prescription_list'),
        )
        self.assertEqual(Prescription.objects.count(), 0)

    def test_receptionist_can_dispense(self):
        prescription = Prescription.objects.create(patient=self.patient)
        PrescriptionItem.objects.create(
            prescription=prescription, medicine=self.medicine, quantity=2, duration_days=2,
        )
        self.client.force_login(create_receptionist())
        self.assertRedirects(
            self.client.post(reverse('pharmacy:prescription_dispense', args=[prescription.pk])),
            reverse('pharmacy:prescription_detail', args=[prescription.pk]),
        )
        prescription.refresh_from_db()
        self.assertEqual(prescription.status, Prescription.Status.DISPENSED)
