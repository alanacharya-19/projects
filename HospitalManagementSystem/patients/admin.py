from django.contrib import admin

from patients.models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'gender', 'phone', 'blood_group', 'created_by', 'created_at')
    list_filter = ('gender', 'blood_group')
    search_fields = ('full_name', 'phone', 'email')
