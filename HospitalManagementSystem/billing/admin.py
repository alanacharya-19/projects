from django.contrib import admin

from billing.models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_no', 'patient', 'status', 'total', 'paid_amount', 'balance', 'due_date', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('invoice_no', 'patient__full_name')
    readonly_fields = ('invoice_no', 'created_at', 'updated_at')
    autocomplete_fields = ('patient', 'appointment')
    inlines = [InvoiceItemInline]

    @admin.display(description='Balance')
    def balance(self, obj):
        return obj.balance
