from django.contrib import admin

from doctors.models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'department', 'specialty', 'consultation_fee', 'is_available')
    list_filter = ('department', 'is_available')
    search_fields = ('user__first_name', 'user__last_name', 'specialty')
