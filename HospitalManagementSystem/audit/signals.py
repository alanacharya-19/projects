"""Signal-based audit logging for every audited model save/delete."""
from django.apps import apps
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from audit.middleware import get_current_request
from audit.models import AuditLog

# Models we never want to pollute the audit trail with.
EXCLUDED_MODELS = {
    ('audit', 'auditlog'),
    ('notifications', 'notification'),
    ('django_admin_log', 'logentry'),
    ('django_session', 'session'),
    ('contenttypes', 'contenttype'),
    ('auth', 'permission'),
    ('auth', 'group'),
}


def _skip(sender):
    label = (sender._meta.app_label, sender._meta.model_name)
    return label in EXCLUDED_MODELS


def _get_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


@receiver(post_save, dispatch_uid='audit_post_save')
def log_save(sender, instance, created, **kwargs):
    if _skip(sender):
        return
    request = get_current_request()
    if request is None or not getattr(request, 'user', None) or not request.user.is_authenticated:
        return
    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.CREATED if created else AuditLog.Action.UPDATED,
        app_label=sender._meta.app_label,
        model_name=sender._meta.model_name,
        object_id=str(instance.pk),
        object_repr=str(instance)[:200],
        ip_address=_get_ip(request),
        request_path=request.get_full_path()[:300],
    )


@receiver(post_delete, dispatch_uid='audit_post_delete')
def log_delete(sender, instance, **kwargs):
    if _skip(sender):
        return
    request = get_current_request()
    if request is None or not getattr(request, 'user', None) or not request.user.is_authenticated:
        return
    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.Action.DELETED,
        app_label=sender._meta.app_label,
        model_name=sender._meta.model_name,
        object_id=str(instance.pk),
        object_repr=str(instance)[:200],
        ip_address=_get_ip(request),
        request_path=request.get_full_path()[:300],
    )
