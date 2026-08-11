from django.contrib import admin

from admissions.models import Admission, Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'floor', 'room_type', 'rate_per_day', 'capacity', 'status')
    list_filter = ('room_type', 'status')
    search_fields = ('room_number', 'floor')


@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ('admission_no', 'patient', 'room', 'assigned_doctor', 'status', 'admitted_at')
    list_filter = ('status',)
    search_fields = ('admission_no', 'patient__full_name')
    readonly_fields = ('admission_no',)
