from django.contrib import admin

from departments.models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'doctor_count', 'created_at')
    search_fields = ('name',)

    def doctor_count(self, obj):
        return obj.doctors.count()
    doctor_count.short_description = 'Doctors'
