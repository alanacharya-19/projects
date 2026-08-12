from decimal import Decimal

from django.db.models import Count, Sum
from django.urls import reverse
from django.utils import timezone
from django.views.generic import TemplateView, View

from admissions.models import Admission, Room
from appointments.models import Appointment
from billing.models import Invoice
from hospital.export import csv_response
from laboratory.models import LabTestOrder
from pharmacy.models import Medicine, Prescription
from accounts.mixins import RoleRequiredMixin
from reports.forms import ReportForm


def _month_list(start, end):
    months = []
    y, m = start.year, start.month
    end_y, end_m = end.year, end.month
    while (y, m) <= (end_y, end_m):
        months.append((y, m))
        m += 1
        if m == 13:
            m = 1
            y += 1
    return months


def _monthly_revenue(start, end):
    series = []
    for year, month in _month_list(start, end):
        total = Invoice.objects.filter(
            created_at__year=year,
            created_at__month=month,
        ).exclude(status=Invoice.Status.CANCELLED).aggregate(
            total=Sum('paid_amount'),
        )['total'] or 0
        series.append({
            'label': timezone.datetime(year, month, 1).strftime('%b %y'),
            'value': float(total),
        })
    max_value = max((p['value'] for p in series), default=0) or 1
    for point in series:
        point['pct'] = round(point['value'] / max_value * 100)
    return series


def _report_dates(form):
    if form.is_valid():
        start = form.cleaned_data.get('start_date')
        end = form.cleaned_data.get('end_date')
    else:
        start = end = None
    today = timezone.localdate()
    if start is None:
        start = today.replace(month=1, day=1)
    if end is None:
        end = today
    return start, end


def _export_url(request, name):
    url = reverse(name)
    qs = request.GET.urlencode()
    return f'{url}?{qs}' if qs else url


class ReportIndexView(RoleRequiredMixin, TemplateView):
    template_name = 'reports/index.html'


class FinancialReportView(RoleRequiredMixin, TemplateView):
    template_name = 'reports/financial.html'
    roles = ('admin', 'receptionist')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        form = ReportForm(self.request.GET or None)
        start, end = _report_dates(form)

        invoices = Invoice.objects.select_related('patient').exclude(
            status=Invoice.Status.CANCELLED,
        ).filter(created_at__date__gte=start, created_at__date__lte=end)
        total_billed = sum((i.total for i in invoices), Decimal('0.00'))
        total_collected = invoices.aggregate(total=Sum('paid_amount'))['total'] or 0
        outstanding_qs = invoices.filter(status__in=['pending', 'partial'])
        outstanding = sum((i.balance for i in outstanding_qs), Decimal('0.00'))
        payment_breakdown = list(
            invoices.values('payment_method').annotate(total=Sum('paid_amount')).order_by('-total'),
        )
        payment_labels = dict(Invoice.PaymentMethod.choices)

        context.update({
            'form': form,
            'start': start,
            'end': end,
            'reset_url': reverse('reports:financial'),
            'export_url': _export_url(self.request, 'reports:financial_export'),
            'total_billed': total_billed,
            'total_collected': total_collected,
            'outstanding': outstanding,
            'invoice_count': invoices.count(),
            'pending_count': outstanding_qs.count(),
            'cancelled_count': Invoice.objects.filter(
                status=Invoice.Status.CANCELLED,
                created_at__date__gte=start,
                created_at__date__lte=end,
            ).count(),
            'payment_breakdown': [
                {
                    'label': payment_labels.get(row['payment_method'], row['payment_method']),
                    'total': row['total'],
                }
                for row in payment_breakdown
            ],
            'monthly_series': _monthly_revenue(start, end),
            'invoices': invoices[:25],
        })
        return context


class FinancialExportView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')

    def get(self, request, *args, **kwargs):
        form = ReportForm(request.GET or None)
        start, end = _report_dates(form)
        invoices = Invoice.objects.select_related('patient').filter(
            created_at__date__gte=start,
            created_at__date__lte=end,
        )
        rows = [
            (
                i.invoice_no, i.patient.full_name, i.get_status_display(), i.created_at.date(),
                f'{i.total:.2f}', f'{i.paid_amount:.2f}', f'{i.balance:.2f}', i.get_payment_method_display(),
            )
            for i in invoices
        ]
        headers = ['Invoice No', 'Patient', 'Status', 'Date', 'Total', 'Paid', 'Balance', 'Payment Method']
        return csv_response('financial_report.csv', headers, rows)


class ClinicalReportView(RoleRequiredMixin, TemplateView):
    template_name = 'reports/clinical.html'
    roles = ('admin', 'doctor')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        form = ReportForm(self.request.GET or None)
        start, end = _report_dates(form)

        appointments = Appointment.objects.filter(date__gte=start, date__lte=end)
        prescriptions = Prescription.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
        lab_orders = LabTestOrder.objects.filter(created_at__date__gte=start, created_at__date__lte=end)

        appointment_status = dict(appointments.values_list('status').annotate(count=Count('pk')))
        lab_status = dict(lab_orders.values_list('status').annotate(count=Count('pk')))

        context.update({
            'form': form,
            'start': start,
            'end': end,
            'reset_url': reverse('reports:clinical'),
            'export_url': _export_url(self.request, 'reports:clinical_export'),
            'appointment_count': appointments.count(),
            'appointment_status': {
                label: appointment_status.get(value, 0)
                for value, label in Appointment.Status.choices
            },
            'prescription_count': prescriptions.count(),
            'prescription_status': {
                label: prescriptions.filter(status=value).count()
                for value, label in Prescription.Status.choices
            },
            'lab_order_count': lab_orders.count(),
            'lab_status': {
                label: lab_status.get(value, 0)
                for value, label in LabTestOrder.Status.choices
            },
            'recent_appointments': appointments.select_related('patient', 'doctor__user').order_by('-date')[:10],
        })
        return context


class ClinicalExportView(RoleRequiredMixin, View):
    roles = ('admin', 'doctor')

    def get(self, request, *args, **kwargs):
        form = ReportForm(request.GET or None)
        start, end = _report_dates(form)
        appointments = Appointment.objects.select_related('patient', 'doctor__user').filter(
            date__gte=start, date__lte=end,
        )
        rows = [
            (
                a.patient.full_name, a.doctor.user.get_full_name(), a.date, a.time,
                a.get_status_display(), a.reason,
            )
            for a in appointments
        ]
        headers = ['Patient', 'Doctor', 'Date', 'Time', 'Status', 'Reason']
        return csv_response('clinical_report.csv', headers, rows)


class OperationsReportView(RoleRequiredMixin, TemplateView):
    template_name = 'reports/operations.html'
    roles = ('admin',)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        rooms = Room.objects.all()
        total_capacity = sum((r.capacity for r in rooms), 0)
        occupied_beds = sum((r.active_admissions for r in rooms), 0)
        occupancy_rate = round(occupied_beds / total_capacity * 100) if total_capacity else 0

        rooms_by_type = []
        for room_type in Room.RoomType.choices:
            value, label = room_type
            type_rooms = rooms.filter(room_type=value)
            capacity = sum((r.capacity for r in type_rooms), 0)
            occupied = sum((r.active_admissions for r in type_rooms), 0)
            rooms_by_type.append({
                'label': label,
                'rooms': type_rooms.count(),
                'capacity': capacity,
                'occupied': occupied,
            })

        medicines = Medicine.objects.all()
        low_stock = [m for m in medicines if m.is_low_stock]

        context.update({
            'room_count': rooms.count(),
            'available_count': rooms.filter(status=Room.Status.AVAILABLE).count(),
            'occupied_rooms': rooms.filter(status=Room.Status.OCCUPIED).count(),
            'maintenance_count': rooms.filter(status=Room.Status.MAINTENANCE).count(),
            'total_capacity': total_capacity,
            'occupied_beds': occupied_beds,
            'occupancy_rate': occupancy_rate,
            'rooms_by_type': rooms_by_type,
            'active_admissions': Admission.objects.filter(status=Admission.Status.ADMITTED).count(),
            'low_stock': low_stock,
            'low_stock_count': len(low_stock),
            'stock_value': sum((m.stock_value for m in medicines), Decimal('0.00')),
        })
        return context


class OperationsExportView(RoleRequiredMixin, View):
    roles = ('admin',)

    def get(self, request, *args, **kwargs):
        room_rows = [
            (
                r.room_number, r.get_room_type_display(), r.floor, r.status,
                f'{r.capacity}', r.active_admissions, f'{r.rate_per_day:.2f}',
            )
            for r in Room.objects.all()
        ]
        headers = ['Room', 'Type', 'Floor', 'Status', 'Capacity', 'Occupied', 'Rate / Day']
        return csv_response('operations_report.csv', headers, room_rows)
