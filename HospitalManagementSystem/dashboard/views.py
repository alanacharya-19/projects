from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q, Sum
from django.shortcuts import render
from django.utils import timezone

from appointments.models import Appointment
from billing.models import Invoice
from doctors.models import Doctor
from patients.models import Patient


def _last_months(months=6):
    """Return a list of (year, month) tuples for the last N months, oldest first."""
    today = timezone.localdate()
    year, month = today.year, today.month
    result = []
    for _ in range(months):
        result.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(result))


def _monthly_revenue(months=6):
    series = []
    for year, month in _last_months(months):
        total = Invoice.objects.filter(
            created_at__year=year,
            created_at__month=month,
        ).exclude(status=Invoice.Status.CANCELLED).aggregate(
            total=Sum('paid_amount'),
        )['total'] or 0
        series.append({
            'label': timezone.datetime(year, month, 1).strftime('%b'),
            'value': float(total),
        })
    max_value = max((p['value'] for p in series), default=0) or 1
    for point in series:
        point['pct'] = round(point['value'] / max_value * 100)
    return series


def _status_donut(appointments_qs):
    statuses = (
        (Appointment.Status.SCHEDULED, 'Scheduled', '#4f46e5'),
        (Appointment.Status.COMPLETED, 'Completed', '#10b981'),
        (Appointment.Status.CANCELLED, 'Cancelled', '#ef4444'),
    )
    totals = dict(appointments_qs.values_list('status').annotate(count=Count('pk')))
    overall = sum(totals.values()) or 1
    parts = []
    cumulative = 0
    gradient_parts = []
    for value, label, color in statuses:
        count = totals.get(value, 0)
        start = cumulative
        cumulative += count
        parts.append((label, count, color))
        if count:
            gradient_parts.append(
                f'{color} {start / overall * 360:.1f}deg {cumulative / overall * 360:.1f}deg'
            )
    if cumulative == 0:
        return [], '0', '#e5e7eb'
    gradient = ', '.join(gradient_parts)
    return parts, f'{overall}', gradient


@login_required
def index(request):
    today = timezone.localdate()
    user = request.user

    if user.is_doctor():
        profile = getattr(user, 'doctor_profile', None)
        if profile:
            my_qs = Appointment.objects.filter(doctor=profile)
            todays_qs = my_qs.filter(date=today, status=Appointment.Status.SCHEDULED)
            parts, total, gradient = _status_donut(my_qs)
            context = {
                'role': 'doctor',
                'today_appointments': todays_qs.count(),
                'total_appointments': my_qs.count(),
                'completed_appointments': my_qs.filter(status=Appointment.Status.COMPLETED).count(),
                'total_patients': Patient.objects.count(),
                'recent_patients': Patient.objects.order_by('-created_at')[:5],
                'todays_appointments': todays_qs.select_related('patient', 'doctor__user')[:5],
                'donut_parts': parts,
                'donut_total': total,
                'donut_gradient': gradient,
                'is_doctor': True,
            }
            return render(request, 'dashboard/index.html', context)
        user_role = None
    else:
        user_role = user.role

    appointments_qs = Appointment.objects.filter(date=today, status=Appointment.Status.SCHEDULED)
    parts, total, gradient = _status_donut(Appointment.objects.all())

    revenue = Invoice.objects.exclude(status=Invoice.Status.CANCELLED).aggregate(
        total=Sum('paid_amount'),
    )['total'] or 0
    outstanding = sum(
        (i.balance for i in Invoice.objects.filter(status__in=['pending', 'partial'])),
        0,
    )
    revenue_series = _monthly_revenue()

    context = {
        'role': user_role,
        'total_patients': Patient.objects.count(),
        'total_doctors': Doctor.objects.count(),
        'today_appointments': appointments_qs.count(),
        'revenue': float(revenue),
        'outstanding': float(outstanding),
        'pending_invoices': Invoice.objects.filter(status__in=['pending', 'partial']).count(),
        'recent_patients': Patient.objects.order_by('-created_at')[:5],
        'recent_doctors': Doctor.objects.select_related('user', 'department').order_by('-created_at')[:5],
        'todays_appointments': appointments_qs.select_related('patient', 'doctor__user')[:5],
        'recent_invoices': Invoice.objects.select_related('patient').order_by('-created_at')[:5],
        'revenue_series': revenue_series,
        'donut_parts': parts,
        'donut_total': total,
        'donut_gradient': gradient,
        'is_admin_or_receptionist': True,
    }
    return render(request, 'dashboard/index.html', context)


@login_required
def search(request):
    q = request.GET.get('q', '').strip()
    context = {'query': q}
    if q:
        patient_qs = Patient.objects.filter(
            Q(full_name__icontains=q)
            | Q(phone__icontains=q)
            | Q(email__icontains=q)
        )
        doctor_qs = Doctor.objects.select_related('user', 'department').filter(
            Q(user__first_name__icontains=q)
            | Q(user__last_name__icontains=q)
            | Q(specialty__icontains=q)
            | Q(department__name__icontains=q)
        )
        appointment_qs = Appointment.objects.select_related('patient', 'doctor__user').filter(
            Q(patient__full_name__icontains=q)
            | Q(doctor__user__first_name__icontains=q)
            | Q(doctor__user__last_name__icontains=q)
            | Q(reason__icontains=q)
        )
        invoice_qs = Invoice.objects.select_related('patient').filter(
            Q(invoice_no__icontains=q)
            | Q(patient__full_name__icontains=q)
        )
        context.update({
            'patients': patient_qs[:8],
            'doctors': doctor_qs[:8],
            'appointments': appointment_qs[:8],
            'invoices': invoice_qs[:8],
            'total_results': (
                patient_qs.count() + doctor_qs.count()
                + appointment_qs.count() + invoice_qs.count()
            ),
        })
    return render(request, 'dashboard/search.html', context)
