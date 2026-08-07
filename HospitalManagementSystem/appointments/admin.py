from django.contrib import admin

from appointments.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'time', 'status', 'created_by')
    list_filter = ('status', 'date', 'doctor')
    search_fields = ('patient__full_name', 'doctor__user__first_name', 'doctor__user__last_name')
