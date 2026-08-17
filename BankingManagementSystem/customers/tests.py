from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from customers.models import Customer


class RegisterViewTests(APITestCase):
    def test_register_creates_user_and_customer(self):
        payload = {
            "username": "alice",
            "password": "SecurePass123!",
            "email": "alice@example.com",
            "first_name": "Alice",
            "last_name": "Smith",
            "phone": "+12345678901",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="alice").exists())
        self.assertTrue(Customer.objects.filter(user__username="alice").exists())
        self.assertEqual(response.data["user"]["username"], "alice")
        self.assertEqual(response.data["phone"], "+12345678901")
        self.assertFalse(response.data["is_verified"])

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username="bob", password="SecurePass123!")
        payload = {
            "username": "bob",
            "password": "SecurePass123!",
            "phone": "+12345678902",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_short_password(self):
        payload = {
            "username": "carol",
            "password": "short",
            "phone": "+12345678903",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
