from django.contrib import admin

from accounts.models import BankAccount
from customers.models import Customer


class BankAccountInline(admin.TabularInline):
    model = BankAccount
    extra = 0
    readonly_fields = ["account_number", "balance", "status"]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "phone", "is_verified", "created_at"]
    list_filter = ["is_verified", "created_at"]
    search_fields = ["user__username", "user__email", "phone"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [BankAccountInline]
