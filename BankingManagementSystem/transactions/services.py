"""Service layer for banking operations.

All money movement goes through these functions. Every operation runs inside
an atomic database transaction so a failure can never leave balances in a
partially-updated state. One immutable Transaction record is written per move.
"""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction as db_transaction

from accounts.models import AccountStatus, BankAccount
from transactions.models import Transaction, TransactionStatus, TransactionType


def _validate_amount(amount: Decimal) -> Decimal:
    """Validate and normalise a money amount."""
    try:
        amount = Decimal(str(amount))
    except Exception as exc:  # noqa: BLE001
        raise ValidationError("Amount must be a valid number.") from exc

    if amount <= 0:
        raise ValidationError("Amount must be greater than zero.")
    if amount.as_tuple().exponent < -2:
        raise ValidationError("Amount cannot have more than 2 decimal places.")
    return amount


def _ensure_account_active(account: BankAccount) -> None:
    if account.status != AccountStatus.ACTIVE:
        raise ValidationError(
            f"Account {account.account_number} is not active "
            f"(status: {account.get_status_display()})."
        )


def _log_transaction(
    account: BankAccount,
    transaction_type: TransactionType,
    amount: Decimal,
    balance_after: Decimal,
    description: str = "",
    related_account: BankAccount | None = None,
) -> Transaction:
    """Persist an immutable transaction record."""
    return Transaction.objects.create(
        account=account,
        related_account=related_account,
        transaction_type=transaction_type,
        amount=amount,
        balance_after=balance_after,
        status=TransactionStatus.COMPLETED,
        description=description,
    )


@db_transaction.atomic
def deposit(account: BankAccount, amount: Decimal, description: str = "Cash deposit") -> Transaction:
    """Add money to an account."""
    amount = _validate_amount(amount)
    _ensure_account_active(account)

    account.refresh_from_db()
    account.balance += amount
    account.save(update_fields=["balance", "updated_at"])

    return _log_transaction(
        account=account,
        transaction_type=TransactionType.DEPOSIT,
        amount=amount,
        balance_after=account.balance,
        description=description,
    )


@db_transaction.atomic
def withdraw(account: BankAccount, amount: Decimal, description: str = "Cash withdrawal") -> Transaction:
    """Remove money from an account, refusing overdrafts."""
    amount = _validate_amount(amount)
    _ensure_account_active(account)

    account.refresh_from_db()
    if amount > account.balance:
        raise ValidationError("Insufficient funds.")

    account.balance -= amount
    account.save(update_fields=["balance", "updated_at"])

    return _log_transaction(
        account=account,
        transaction_type=TransactionType.WITHDRAWAL,
        amount=amount,
        balance_after=account.balance,
        description=description,
    )


@db_transaction.atomic
def transfer(
    from_account: BankAccount,
    to_account: BankAccount,
    amount: Decimal,
    description: str = "Account transfer",
) -> Transaction:
    """Move money between two accounts atomically."""
    amount = _validate_amount(amount)
    _ensure_account_active(from_account)
    _ensure_account_active(to_account)
    if from_account.pk == to_account.pk:
        raise ValidationError("Source and destination accounts must be different.")

    from_account.refresh_from_db()
    if amount > from_account.balance:
        raise ValidationError("Insufficient funds.")

    from_account.balance -= amount
    to_account.balance += amount
    from_account.save(update_fields=["balance", "updated_at"])
    to_account.save(update_fields=["balance", "updated_at"])

    return _log_transaction(
        account=from_account,
        related_account=to_account,
        transaction_type=TransactionType.TRANSFER,
        amount=amount,
        balance_after=from_account.balance,
        description=description,
    )
