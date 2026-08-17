import uuid

from django.db import models

from accounts.models import BankAccount


class TransactionType(models.TextChoices):
    DEPOSIT = "DEPOSIT", "Deposit"
    WITHDRAWAL = "WITHDRAWAL", "Withdrawal"
    TRANSFER = "TRANSFER", "Transfer"


class TransactionStatus(models.TextChoices):
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    PENDING = "PENDING", "Pending"


class Transaction(models.Model):
    """An immutable financial record created by a deposit, withdrawal or transfer."""

    account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    related_account = models.ForeignKey(
        BankAccount,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="related_transactions",
        help_text="Counter-party account (used for transfers).",
    )
    transaction_type = models.CharField(
        max_length=12,
        choices=TransactionType.choices,
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(
        max_length=10,
        choices=TransactionStatus.choices,
        default=TransactionStatus.COMPLETED,
    )
    reference = models.CharField(max_length=32, unique=True, editable=False)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.reference} {self.get_transaction_type_display()} {self.amount}"

    def save(self, *args, **kwargs) -> None:
        if not self.reference:
            self.reference = self._generate_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_reference() -> str:
        """Generate a unique transaction reference."""
        return f"TRX-{uuid.uuid4().hex[:20].upper()}"
