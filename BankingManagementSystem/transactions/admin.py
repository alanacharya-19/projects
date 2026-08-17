from django.contrib import admin

from transactions.models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "reference",
        "account",
        "transaction_type",
        "amount",
        "balance_after",
        "status",
        "created_at",
    ]
    list_filter = ["transaction_type", "status", "created_at"]
    search_fields = ["reference", "account__account_number", "description"]
    readonly_fields = [
        "account",
        "related_account",
        "transaction_type",
        "amount",
        "balance_after",
        "status",
        "reference",
        "description",
        "created_at",
    ]
