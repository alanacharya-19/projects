from django.contrib.auth.models import User
from rest_framework import serializers

from customers.models import Customer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "user",
            "phone",
            "address",
            "date_of_birth",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_verified", "created_at", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    """Creates a User and its Customer profile in one shot."""

    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "phone",
            "address",
            "date_of_birth",
        ]

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data: dict) -> Customer:
        phone = validated_data.pop("phone")
        address = validated_data.pop("address", "")
        date_of_birth = validated_data.pop("date_of_birth", None)

        user = User.objects.create_user(**validated_data)
        return Customer.objects.create(
            user=user,
            phone=phone,
            address=address,
            date_of_birth=date_of_birth,
        )
