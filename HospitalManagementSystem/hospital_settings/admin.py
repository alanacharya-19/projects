from django.contrib import admin

from hospital_settings.models import HospitalSettings


@admin.register(HospitalSettings)
class HospitalSettingsAdmin(admin.ModelAdmin):
    list_display = ('hospital_name', 'phone', 'email', 'updated_at')
