from django.contrib import admin

from accounts.models import BankAccount
from transactions.models import Transaction


class TransactionInline(admin.TabularInline):
    model = Transaction
    fk_name = "account"
    extra = 0
    readonly_fields = [
        "reference",
        "related_account",
        "transaction_type",
        "amount",
        "balance_after",
        "status",
        "description",
        "created_at",
    ]
    can_delete = False


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = [
        "account_number",
        "customer",
        "account_type",
        "status",
        "balance",
        "created_at",
    ]
    list_filter = ["account_type", "status", "created_at"]
    search_fields = ["account_number", "customer__user__username"]
    readonly_fields = ["account_number", "balance", "created_at", "updated_at"]
    inlines = [TransactionInline]
