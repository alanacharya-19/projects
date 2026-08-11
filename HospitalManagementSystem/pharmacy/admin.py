from django.contrib import admin

from pharmacy.models import Medicine, Prescription, PrescriptionItem, StockMovement


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1


class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 0
    readonly_fields = ('quantity', 'reason', 'user', 'created_at')
    can_delete = False


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock_quantity', 'reorder_level', 'expiry_date', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'generic_name', 'batch_number')
    inlines = [StockMovementInline]


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('prescription_no', 'patient', 'doctor', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('prescription_no', 'patient__full_name')
    inlines = [PrescriptionItemInline]
