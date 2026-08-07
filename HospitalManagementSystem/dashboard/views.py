from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils import timezone

from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient


@login_required
def index(request):
    today = timezone.localdate()
    appointments_qs = Appointment.objects.filter(
        date=today,
        status=Appointment.Status.SCHEDULED,
    )
    if request.user.is_doctor():
        appointments_qs = appointments_qs.filter(doctor__user=request.user)

    context = {
        'total_patients': Patient.objects.count(),
        'total_doctors': Doctor.objects.count(),
        'today_appointments': appointments_qs.count(),
        'revenue': 0,                 # Placeholder until the Billing module is built
        'user_role': request.user.role,
        'recent_patients': Patient.objects.order_by('-created_at')[:5],
        'recent_doctors': Doctor.objects.select_related('user', 'department').order_by('-created_at')[:5],
        'todays_appointments': appointments_qs.select_related('patient', 'doctor__user')[:5],
    }
    return render(request, 'dashboard/index.html', context)
