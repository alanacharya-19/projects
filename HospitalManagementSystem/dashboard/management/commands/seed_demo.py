"""Populate the database with demo data so every module can be explored.

Run with:  python manage.py seed_demo

The command is idempotent: catalog data (departments, medicines, lab tests,
rooms, users) is created or updated in place, while transaction-style demo
records (appointments, invoices, prescriptions, lab orders, admissions) are
only created once.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from admissions.models import Admission, Room
from appointments.models import Appointment
from billing.models import Invoice, InvoiceItem
from departments.models import Department
from doctors.models import Doctor
from hospital_settings.models import HospitalSettings
from laboratory.models import LabTestItem, LabTestOrder, LabTestType
from medical_records.models import MedicalRecord
from notifications.utils import notify_users
from patients.models import Patient
from pharmacy.models import Medicine, Prescription, PrescriptionItem, StockMovement

User = get_user_model()

DEMO_PATIENT_PHONES = [
    '0300-0000001', '0300-0000002', '0300-0000003',
    '0300-0000004', '0300-0000005',
]


class Command(BaseCommand):
    help = 'Seed the database with demo users, patients, and data for every module.'

    def _ensure_catalog(self):
        settings_obj, _ = HospitalSettings.objects.get_or_create(pk=1)
        settings_obj.hospital_name = 'MediCare Hospital'
        settings_obj.tagline = 'Caring for your health, every step of the way'
        settings_obj.address = 'Main Boulevard, Gulberg III, Lahore'
        settings_obj.phone = '+92-42-3571-0000'
        settings_obj.email = 'info@medicare.example.com'
        settings_obj.currency = '$'
        settings_obj.working_hours = 'Mon-Sat, 9:00 AM - 6:00 PM'
        settings_obj.footer_text = 'MediCare Hospital - Committed to excellence in healthcare'
        settings_obj.save()

        departments = [
            ('Cardiology', 'Diagnosis and treatment of heart conditions.'),
            ('Neurology', 'Care for disorders of the brain and nervous system.'),
            ('Orthopedics', 'Treatment of bones, joints, and muscles.'),
            ('Pediatrics', 'Medical care for infants, children, and adolescents.'),
            ('General Medicine', 'Primary care and internal medicine.'),
        ]
        for name, description in departments:
            Department.objects.get_or_create(name=name, defaults={'description': description})

        medicines = [
            ('Paracetamol 500mg', 'Paracetamol', 'tablet', 'tablet', '2.50', 500, 50),
            ('Amoxicillin 250mg', 'Amoxicillin', 'capsule', 'capsule', '5.00', 300, 40),
            ('Metformin 850mg', 'Metformin', 'tablet', 'tablet', '3.00', 250, 40),
            ('Cetirizine 10mg', 'Cetirizine', 'tablet', 'tablet', '1.50', 400, 60),
            ('Omeprazole 20mg', 'Omeprazole', 'capsule', 'capsule', '4.00', 200, 40),
            ('Amoxiclav 625mg', 'Amoxicillin + Clavulanic acid', 'tablet', 'tablet', '12.00', 120, 30),
            ('ORS Sachet', 'Oral rehydration salts', 'other', 'sachet', '0.80', 800, 100),
            ('Insulin Glargine', 'Insulin glargine', 'injection', 'vial', '35.00', 40, 10),
            ('Salbutamol Inhaler', 'Salbutamol', 'inhaler', 'inhaler', '18.00', 25, 8),
            ('Diclofenac Gel 30g', 'Diclofenac', 'ointment', 'tube', '6.50', 90, 20),
        ]
        for name, generic, category, unit, price, stock, reorder in medicines:
            Medicine.objects.get_or_create(
                name=name,
                defaults={
                    'generic_name': generic,
                    'category': category,
                    'unit': unit,
                    'price': price,
                    'stock_quantity': stock,
                    'reorder_level': reorder,
                    'supplier': 'MediCare Wholesale',
                },
            )

        lab_tests = [
            ('Complete Blood Count', 'CBC', 'blood', '30.00', 'WBC 4-11, Hb 13-17 g/dL'),
            ('Blood Glucose (Fasting)', 'FBS', 'blood', '8.00', '70-110 mg/dL'),
            ('Lipid Profile', 'LIP', 'blood', '25.00', 'Total chol < 200 mg/dL'),
            ('Liver Function Test', 'LFT', 'blood', '30.00', 'ALT 7-56 U/L'),
            ('Urinalysis', 'U/A', 'urine', '12.00', 'Negative for protein/glucose'),
            ('Chest X-Ray', 'CXR', 'imaging', '45.00', 'No acute abnormality'),
        ]
        for name, code, category, price, ref_range in lab_tests:
            LabTestType.objects.get_or_create(
                name=name,
                defaults={
                    'code': code,
                    'category': category,
                    'price': price,
                    'reference_range': ref_range,
                },
            )

        rooms = [
            ('G-101', 'Ground', 'general', '20.00', 4),
            ('G-102', 'Ground', 'general', '20.00', 4),
            ('F1-201', 'First', 'semi_private', '40.00', 2),
            ('F1-202', 'First', 'semi_private', '40.00', 2),
            ('F2-301', 'Second', 'private', '80.00', 1),
            ('F2-302', 'Second', 'private', '80.00', 1),
            ('ICU-01', 'Second', 'icu', '150.00', 1),
        ]
        for number, floor, room_type, rate, capacity in rooms:
            Room.objects.get_or_create(
                room_number=number,
                defaults={
                    'floor': floor,
                    'room_type': room_type,
                    'rate_per_day': rate,
                    'capacity': capacity,
                },
            )

    def _ensure_users(self):
        admin, _ = User.objects.get_or_create(username='admin')
        admin.role = User.Role.ADMIN
        admin.is_staff = True
        admin.is_superuser = True
        admin.first_name = 'Ayesha'
        admin.last_name = 'Khan'
        admin.email = 'admin@medicare.example.com'
        admin.set_password('admin123')
        admin.save()

        receptionist, _ = User.objects.get_or_create(username='receptionist')
        receptionist.role = User.Role.RECEPTIONIST
        receptionist.is_staff = True
        receptionist.first_name = 'Sara'
        receptionist.last_name = 'Ahmed'
        receptionist.set_password('receptionist123')
        receptionist.save()

        doctor_user, _ = User.objects.get_or_create(username='doctor')
        doctor_user.role = User.Role.DOCTOR
        doctor_user.is_staff = True
        doctor_user.first_name = 'Imran'
        doctor_user.last_name = 'Malik'
        doctor_user.set_password('doctor123')
        doctor_user.save()

        Doctor.objects.get_or_create(
            user=doctor_user,
            defaults={
                'department': Department.objects.get(name='Cardiology'),
                'specialty': 'Interventional Cardiologist',
                'license_no': 'PMC-123456',
                'experience_years': 12,
                'consultation_fee': Decimal('1500.00'),
                'bio': 'Senior cardiologist with a focus on preventive cardiology.',
                'is_available': True,
            },
        )

        admin_doctor, _ = User.objects.get_or_create(username='admin_doctor')
        admin_doctor.role = User.Role.DOCTOR
        admin_doctor.is_staff = True
        admin_doctor.first_name = 'Fatima'
        admin_doctor.last_name = 'Raza'
        admin_doctor.set_password('doctor123')
        admin_doctor.save()
        Doctor.objects.get_or_create(
            user=admin_doctor,
            defaults={
                'department': Department.objects.get(name='Pediatrics'),
                'specialty': 'Pediatrician',
                'license_no': 'PMC-654321',
                'experience_years': 8,
                'consultation_fee': Decimal('1200.00'),
                'bio': 'Caring pediatrician dedicated to children\u2019s health.',
                'is_available': True,
            },
        )

        return admin, receptionist, doctor_user

    def _ensure_patients(self, created_by):
        patients = []
        demos = [
            ('Ahmed Ali', 'M', date(1985, 4, 12), 'A+', '0300-0000001'),
            ('Sana Javed', 'F', date(1992, 9, 3), 'B+', '0300-0000002'),
            ('Usman Tariq', 'M', date(1978, 1, 25), 'O-', '0300-0000003'),
            ('Maryam Aslam', 'F', date(2001, 6, 17), 'AB+', '0300-0000004'),
            ('Hassan Raza', 'M', date(2015, 11, 30), 'B-', '0300-0000005'),
        ]
        for full_name, gender, dob, blood, phone in demos:
            patient, _ = Patient.objects.get_or_create(
                phone=phone,
                defaults={
                    'full_name': full_name,
                    'gender': gender,
                    'date_of_birth': dob,
                    'blood_group': blood,
                    'email': f'{full_name.lower().replace(" ", ".")}@example.com',
                    'address': 'Sample Address, Lahore',
                    'emergency_contact_name': 'Emergency Contact',
                    'emergency_contact_phone': '0321-0000000',
                    'medical_history': 'No known allergies.',
                    'created_by': created_by,
                },
            )
            patients.append(patient)
        return patients

    def _create_transactional(self, patients, admin, receptionist, doctor_user):
        doctors = list(Doctor.objects.all())
        if not doctors:
            return
        doctor = doctors[0]
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)

        created_any = False
        if not Appointment.objects.filter(patient__in=patients).exists():
            created_any = True
            appointments = []
            for i, patient in enumerate(patients):
                slot = (datetime(2000, 1, 1, 9, 0) + timedelta(minutes=30 * i)).time()
                appointments.append(Appointment.objects.create(
                    patient=patient,
                    doctor=doctor,
                    date=tomorrow,
                    time=slot,
                    reason='Routine check-up and consultation.',
                    status=Appointment.Status.SCHEDULED,
                    created_by=receptionist,
                ))
            for patient, apt in zip(patients[:2], appointments[:2]):
                MedicalRecord.objects.create(
                    patient=patient,
                    doctor=doctor,
                    appointment=apt,
                    diagnosis='Seasonal flu with mild fever.',
                    prescription='Paracetamol 500mg twice daily for 5 days.',
                    doctor_notes='Rest, hydration, and follow up if fever persists.',
                )

            invoices = []
            for patient in patients[:4]:
                invoice = Invoice.objects.create(
                    patient=patient,
                    appointment=appointments[0],
                    status=Invoice.Status.PENDING,
                    discount=Decimal('50.00'),
                    tax=Decimal('30.00'),
                    due_date=today + timedelta(days=15),
                    created_by=receptionist,
                )
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description='Consultation fee',
                    quantity=1,
                    unit_price=Decimal('1500.00'),
                )
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description='Pharmacy - Paracetamol 500mg',
                    quantity=2,
                    unit_price=Decimal('2.50'),
                )
                invoices.append(invoice)
            invoices[0].status = Invoice.Status.PAID
            invoices[0].paid_amount = invoices[0].total
            invoices[0].payment_method = Invoice.PaymentMethod.CASH
            invoices[0].save()

            rx = Prescription.objects.create(
                patient=patients[0],
                doctor=doctor,
                status=Prescription.Status.ACTIVE,
                notes='Take with food.',
                created_by=doctor_user,
            )
            PrescriptionItem.objects.create(
                prescription=rx,
                medicine=Medicine.objects.get(name='Paracetamol 500mg'),
                dosage='1 tablet',
                frequency='2 times a day',
                duration_days=5,
                quantity=10,
                instructions='After meals',
            )
            PrescriptionItem.objects.create(
                prescription=rx,
                medicine=Medicine.objects.get(name='ORS Sachet'),
                dosage='1 sachet',
                frequency='3 times a day',
                duration_days=3,
                quantity=9,
                instructions='Dissolve in water',
            )
            rx.dispense(doctor_user)

            lab = LabTestOrder.objects.create(
                patient=patients[1],
                doctor=doctor,
                status=LabTestOrder.Status.COMPLETED,
                clinical_notes='Fever with body aches for 3 days.',
                ordered_by=doctor_user,
            )
            cbc = LabTestItem.objects.create(
                order=lab,
                test_type=LabTestType.objects.get(name='Complete Blood Count'),
            )
            fbs = LabTestItem.objects.create(
                order=lab,
                test_type=LabTestType.objects.get(name='Blood Glucose (Fasting)'),
            )
            cbc.mark_completed(doctor_user, 'WBC 8.2, Hb 14.1, Platelets 250k', 'WBC 4-11, Hb 13-17 g/dL')
            fbs.mark_completed(doctor_user, '95 mg/dL', '70-110 mg/dL')

            room = Room.objects.get(room_number='F2-301')
            Admission.objects.create(
                patient=patients[3],
                room=room,
                assigned_doctor=doctor,
                reason='Observation for hypertension management.',
                expected_discharge=today + timedelta(days=3),
                created_by=receptionist,
            )
            room.refresh_status()

            notify_users(
                [admin, receptionist, doctor_user],
                'Demo data seeded',
                'Demo users, patients, and records were created for you.',
                '/',
            )

        if created_any:
            self.stdout.write(self.style.SUCCESS('Demo records created.'))
        else:
            self.stdout.write('Demo records already exist; skipping.')

    def handle(self, *args, **options):
        self._ensure_catalog()
        admin, receptionist, doctor_user = self._ensure_users()
        patients = self._ensure_patients(admin)
        self._create_transactional(patients, admin, receptionist, doctor_user)

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
        self.stdout.write(self.style.SUCCESS(
            'Demo logins: admin/admin123 | receptionist/receptionist123 | doctor/doctor123'
        ))
