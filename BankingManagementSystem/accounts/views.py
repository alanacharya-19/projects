from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import BankAccount
from accounts.serializers import (
    AccountOperationSerializer,
    BankAccountCreateSerializer,
    BankAccountSerializer,
    TransferSerializer,
)
from transactions import services


class BankAccountViewSet(viewsets.ModelViewSet):
    """CRUD for bank accounts plus deposit / withdraw / transfer actions."""

    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return BankAccountCreateSerializer
        return BankAccountSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return BankAccount.objects.none()
        user = self.request.user
        if user.is_staff:
            return BankAccount.objects.select_related("customer__user").all()
        return BankAccount.objects.filter(customer__user=user).select_related("customer__user")

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user.customer)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        account = serializer.save(customer=request.user.customer)
        output = BankAccountSerializer(account).data
        headers = self.get_success_headers(output)
        return Response(output, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"])
    def deposit(self, request, pk=None):
        account = self.get_object()
        serializer = AccountOperationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            transaction = services.deposit(
                account,
                serializer.validated_data["amount"],
                serializer.validated_data.get("description", ""),
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self._transaction_payload(transaction), status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        account = self.get_object()
        serializer = AccountOperationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            transaction = services.withdraw(
                account,
                serializer.validated_data["amount"],
                serializer.validated_data.get("description", ""),
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self._transaction_payload(transaction), status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def transfer(self, request, pk=None):
        from_account = self.get_object()
        serializer = TransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            to_account = BankAccount.objects.get(
                account_number=serializer.validated_data["to_account_number"]
            )
        except BankAccount.DoesNotExist:
            return Response(
                {"detail": ["Destination account not found."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transaction = services.transfer(
                from_account,
                to_account,
                serializer.validated_data["amount"],
                serializer.validated_data.get("description", ""),
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self._transaction_payload(transaction), status=status.HTTP_200_OK)

    @staticmethod
    def _transaction_payload(transaction) -> dict:
        from transactions.serializers import TransactionSerializer

        return TransactionSerializer(transaction).data
