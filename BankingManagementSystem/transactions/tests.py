from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase

from accounts.models import BankAccount, AccountStatus
from customers.models import Customer
from transactions import services
from transactions.models import TransactionType


def create_customer(username: str, phone: str) -> Customer:
    user = User.objects.create_user(username=username, password="SecurePass123!")
    return Customer.objects.create(user=user, phone=phone)


class ServiceLayerTests(TestCase):
    def setUp(self):
        self.customer = create_customer("alice", "+10000000001")
        self.account = BankAccount.objects.create(customer=self.customer)
        self.other_customer = create_customer("bob", "+10000000002")
        self.other_account = BankAccount.objects.create(customer=self.other_customer)

    def test_deposit_updates_balance_and_logs_transaction(self):
        services.deposit(self.account, Decimal("500.00"))
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("500.00"))

        txn = self.account.transactions.get(transaction_type=TransactionType.DEPOSIT)
        self.assertEqual(txn.amount, Decimal("500.00"))
        self.assertEqual(txn.balance_after, Decimal("500.00"))
        self.assertTrue(txn.reference.startswith("TRX-"))

    def test_transfer_moves_money_between_accounts(self):
        services.deposit(self.account, Decimal("300.00"))
        txn = services.transfer(self.account, self.other_account, Decimal("120.50"))

        self.account.refresh_from_db()
        self.other_account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("179.50"))
        self.assertEqual(self.other_account.balance, Decimal("120.50"))
        self.assertEqual(txn.transaction_type, TransactionType.TRANSFER)
        self.assertEqual(txn.related_account, self.other_account)

    def test_transfer_rejects_insufficient_funds(self):
        services.deposit(self.account, Decimal("5.00"))
        with self.assertRaises(ValidationError):
            services.transfer(self.account, self.other_account, Decimal("10.00"))
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("5.00"))

    def test_transfer_rejects_same_account(self):
        with self.assertRaises(ValidationError):
            services.transfer(self.account, self.account, Decimal("10.00"))

    def test_withdraw_rejects_negative_amount(self):
        with self.assertRaises(ValidationError):
            services.withdraw(self.account, Decimal("-5.00"))

    def test_operations_rejected_on_frozen_account(self):
        self.account.status = AccountStatus.FROZEN
        self.account.save()
        with self.assertRaises(ValidationError):
            services.deposit(self.account, Decimal("10.00"))
        with self.assertRaises(ValidationError):
            services.withdraw(self.account, Decimal("10.00"))
