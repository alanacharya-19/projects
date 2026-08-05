from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils import timezone

from accounts.models import User


@login_required
def index(request):
    total_doctors = User.objects.filter(role=User.Role.DOCTOR, is_active=True).count()

    context = {
        'total_patients': 0,          # Populated when the Patients module is built
        'total_doctors': total_doctors,
        'today_appointments': 0,      # Populated when the Appointments module is built
        'revenue': 0,                 # Placeholder until the Billing module is built
        'user_role': request.user.role,
    }
    return render(request, 'dashboard/index.html', context)
