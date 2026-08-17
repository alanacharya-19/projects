from django_filters import rest_framework as filters
from rest_framework import viewsets

from transactions.models import Transaction
from transactions.serializers import TransactionSerializer


class TransactionFilter(filters.FilterSet):
    """Filter transactions by account number and transaction type."""

    account_number = filters.CharFilter(field_name="account__account_number")

    class Meta:
        model = Transaction
        fields = ["transaction_type", "account_number"]


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Customers see their own transactions; staff see everything."""

    serializer_class = TransactionSerializer
    filterset_class = TransactionFilter
    search_fields = ["reference", "description"]
    ordering_fields = ["created_at", "amount"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Transaction.objects.none()
        user = self.request.user
        qs = Transaction.objects.select_related("account", "related_account")
        if user.is_staff:
            return qs
        return qs.filter(account__customer__user=user)
