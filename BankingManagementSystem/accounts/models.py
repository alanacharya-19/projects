import secrets
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from customers.models import Customer


class AccountType(models.TextChoices):
    SAVINGS = "SAVINGS", "Savings"
    CHECKING = "CHECKING", "Checking"
    BUSINESS = "BUSINESS", "Business"


class AccountStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    FROZEN = "FROZEN", "Frozen"
    CLOSED = "CLOSED", "Closed"


class BankAccount(models.Model):
    """A customer's bank account with a running balance."""

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="accounts",
    )
    account_number = models.CharField(max_length=16, unique=True, editable=False)
    account_type = models.CharField(
        max_length=10,
        choices=AccountType.choices,
        default=AccountType.SAVINGS,
    )
    status = models.CharField(
        max_length=10,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
    )
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bank Account"
        verbose_name_plural = "Bank Accounts"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.account_number} ({self.get_account_type_display()})"

    def save(self, *args, **kwargs) -> None:
        if not self.account_number:
            self.account_number = self._generate_account_number()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_account_number() -> str:
        """Generate a unique 10-digit account number."""
        while True:
            candidate = "".join(secrets.choice("0123456789") for _ in range(10))
            if not BankAccount.objects.filter(account_number=candidate).exists():
                return candidate
