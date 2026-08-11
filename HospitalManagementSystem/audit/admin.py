from django.contrib import admin

from audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'action', 'model_name', 'object_repr', 'ip_address')
    list_filter = ('action', 'app_label', 'model_name')
    search_fields = ('user__username', 'object_repr', 'ip_address')
    readonly_fields = ('created_at',)
