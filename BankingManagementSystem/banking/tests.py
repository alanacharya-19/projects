from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import BankAccount
from customers.models import Customer
from transactions import services


def create_customer(username: str, phone: str) -> Customer:
    user = User.objects.create_user(username=username, password="SecurePass123!")
    return Customer.objects.create(user=user, phone=phone)


class TransferAPITests(APITestCase):
    def setUp(self):
        self.sender = create_customer("alice", "+10000000001")
        self.receiver = create_customer("bob", "+10000000002")
        self.sender_account = BankAccount.objects.create(customer=self.sender)
        self.receiver_account = BankAccount.objects.create(customer=self.receiver)
        services.deposit(self.sender_account, Decimal("1000.00"))
        self.client.force_authenticate(user=self.sender.user)

    def test_transfer_via_api(self):
        response = self.client.post(
            f"/api/accounts/{self.sender_account.pk}/transfer/",
            {"to_account_number": self.receiver_account.account_number, "amount": "200.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.sender_account.refresh_from_db()
        self.receiver_account.refresh_from_db()
        self.assertEqual(self.sender_account.balance, Decimal("800.00"))
        self.assertEqual(self.receiver_account.balance, Decimal("200.00"))
        self.assertEqual(response.data["transaction_type"], "TRANSFER")

    def test_transfer_to_unknown_account(self):
        response = self.client.post(
            f"/api/accounts/{self.sender_account.pk}/transfer/",
            {"to_account_number": "0000000000", "amount": "10.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not found", response.data["detail"][0])


class AuthFlowTests(APITestCase):
    def test_register_then_login_then_access_accounts(self):
        register = self.client.post(
            "/api/auth/register/",
            {
                "username": "dave",
                "password": "SecurePass123!",
                "email": "dave@example.com",
                "phone": "+10000000003",
            },
            format="json",
        )
        self.assertEqual(register.status_code, status.HTTP_201_CREATED)

        login = self.client.post(
            "/api/auth/login/",
            {"username": "dave", "password": "SecurePass123!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data)
        self.assertIn("refresh", login.data)

    def test_unauthenticated_request_is_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/accounts/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HomeViewTests(APITestCase):
    def test_home_is_public(self):
        response = self.client.get("/api/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Banking Management System API")
