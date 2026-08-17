from rest_framework import serializers

from accounts.models import AccountStatus, AccountType, BankAccount


class BankAccountSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.user.get_full_name", read_only=True)
    customer_username = serializers.CharField(source="customer.user.username", read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_username",
            "account_number",
            "account_type",
            "status",
            "balance",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "customer",
            "customer_name",
            "customer_username",
            "account_number",
            "balance",
            "status",
            "created_at",
            "updated_at",
        ]


class BankAccountCreateSerializer(serializers.ModelSerializer):
    """Used when a customer opens a new account."""

    class Meta:
        model = BankAccount
        fields = ["account_type"]


class AccountOperationSerializer(serializers.Serializer):
    """Shared body for deposit, withdraw and transfer operations."""

    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class TransferSerializer(serializers.Serializer):
    """Body for the transfer operation."""

    to_account_number = serializers.CharField(max_length=16)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
