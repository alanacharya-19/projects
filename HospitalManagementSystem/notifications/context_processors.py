from notifications.models import Notification


def unread_notifications(request):
    if request.user.is_authenticated:
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).count()
    else:
        count = 0
    return {'unread_count': count}
