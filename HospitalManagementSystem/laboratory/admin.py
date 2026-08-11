from django.contrib import admin

from laboratory.models import LabTestItem, LabTestOrder, LabTestType


class LabTestItemInline(admin.TabularInline):
    model = LabTestItem
    extra = 1


@admin.register(LabTestType)
class LabTestTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'price', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'code')


@admin.register(LabTestOrder)
class LabTestOrderAdmin(admin.ModelAdmin):
    list_display = ('order_no', 'patient', 'doctor', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('order_no', 'patient__full_name')
    inlines = [LabTestItemInline]
