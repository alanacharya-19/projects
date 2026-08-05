from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        DOCTOR = 'doctor', 'Doctor'
        RECEPTIONIST = 'receptionist', 'Receptionist'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN,
        help_text='Determines the dashboard and permissions available to the user.',
    )
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def is_admin(self):
        return self.role == self.Role.ADMIN

    def is_doctor(self):
        return self.role == self.Role.DOCTOR

    def is_receptionist(self):
        return self.role == self.Role.RECEPTIONIST

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'
