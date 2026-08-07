from django.contrib import admin

from medical_records.models import MedicalRecord


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'created_at')
    list_filter = ('doctor', 'created_at')
    search_fields = ('patient__full_name', 'diagnosis')
