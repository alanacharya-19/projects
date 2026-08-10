from django.contrib.auth import get_user_model

from notifications.models import Notification

User = get_user_model()


def notify_users(users, title, message='', link=''):
    """Create one Notification per recipient from an iterable of users."""
    if not users:
        return
    recipients = set(u for u in users if u and u.is_active)
    Notification.objects.bulk_create([
        Notification(recipient=r, title=title, message=message, link=link)
        for r in recipients
    ])


def notify_admins(title, message='', link=''):
    notify_users(User.objects.filter(role=User.Role.ADMIN), title, message, link)


def notify_receptionists(title, message='', link=''):
    notify_users(User.objects.filter(role=User.Role.RECEPTIONIST), title, message, link)
