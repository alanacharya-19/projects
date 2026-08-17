from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import BankAccount, AccountStatus
from customers.models import Customer
from transactions import services
from transactions.models import Transaction, TransactionType


def create_customer(username: str, phone: str) -> Customer:
    user = User.objects.create_user(username=username, password="SecurePass123!")
    return Customer.objects.create(user=user, phone=phone)


class BankAccountAPITests(APITestCase):
    def setUp(self):
        self.customer = create_customer("alice", "+10000000001")
        self.client.force_authenticate(user=self.customer.user)

    def test_create_account(self):
        response = self.client.post("/api/accounts/", {"account_type": "SAVINGS"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["balance"], "0.00")
        self.assertEqual(response.data["account_type"], "SAVINGS")
        self.assertTrue(response.data["account_number"])
        self.assertEqual(response.data["customer"], self.customer.pk)

    def test_deposit_action(self):
        account = BankAccount.objects.create(customer=self.customer)
        response = self.client.post(
            f"/api/accounts/{account.pk}/deposit/",
            {"amount": "250.50"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        account.refresh_from_db()
        self.assertEqual(account.balance, Decimal("250.50"))

    def test_withdraw_action(self):
        account = BankAccount.objects.create(customer=self.customer)
        services.deposit(account, Decimal("100.00"))
        response = self.client.post(
            f"/api/accounts/{account.pk}/withdraw/",
            {"amount": "40.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        account.refresh_from_db()
        self.assertEqual(account.balance, Decimal("60.00"))

    def test_withdraw_insufficient_funds(self):
        account = BankAccount.objects.create(customer=self.customer)
        services.deposit(account, Decimal("10.00"))
        response = self.client.post(
            f"/api/accounts/{account.pk}/withdraw/",
            {"amount": "50.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        account.refresh_from_db()
        self.assertEqual(account.balance, Decimal("10.00"))

    def test_deposit_rejects_non_positive_amount(self):
        account = BankAccount.objects.create(customer=self.customer)
        response = self.client.post(
            f"/api/accounts/{account.pk}/deposit/",
            {"amount": "0"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_cannot_see_another_customers_account(self):
        other = create_customer("mallory", "+10000000002")
        other_account = BankAccount.objects.create(customer=other)
        response = self.client.get(f"/api/accounts/{other_account.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deposit_on_frozen_account_fails(self):
        account = BankAccount.objects.create(customer=self.customer, status=AccountStatus.FROZEN)
        response = self.client.post(
            f"/api/accounts/{account.pk}/deposit/",
            {"amount": "10.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not active", response.data["detail"][0])
