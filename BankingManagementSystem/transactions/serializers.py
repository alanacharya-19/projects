from rest_framework import serializers

from transactions.models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source="account.account_number", read_only=True)
    related_account_number = serializers.CharField(
        source="related_account.account_number",
        read_only=True,
        default=None,
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "reference",
            "account",
            "account_number",
            "related_account",
            "related_account_number",
            "transaction_type",
            "amount",
            "balance_after",
            "status",
            "description",
            "created_at",
        ]
        read_only_fields = fields
