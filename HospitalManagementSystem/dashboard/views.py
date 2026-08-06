from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from accounts.models import User
from doctors.models import Doctor
from patients.models import Patient


@login_required
def index(request):
    total_doctors = Doctor.objects.filter(
        user__is_active=True,
    ).count()
    total_patients = Patient.objects.count()

    context = {
        'total_patients': total_patients,
        'total_doctors': total_doctors,
        'today_appointments': 0,      # Populated when the Appointments module is built
        'revenue': 0,                 # Placeholder until the Billing module is built
        'user_role': request.user.role,
        'recent_patients': Patient.objects.order_by('-created_at')[:5],
        'recent_doctors': Doctor.objects.select_related('user', 'department').order_by('-created_at')[:5],
    }
    return render(request, 'dashboard/index.html', context)
