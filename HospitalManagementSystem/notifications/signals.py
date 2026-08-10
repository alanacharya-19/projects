from django.db.models.signals import post_save
from django.dispatch import receiver
from django.urls import reverse

from appointments.models import Appointment
from billing.models import Invoice
from notifications.utils import notify_admins, notify_receptionists, notify_users


@receiver(post_save, sender=Appointment)
def appointment_notifications(sender, instance, created, **kwargs):
    if created and instance.is_scheduled:
        link = reverse('appointments:list')
        notify_users(
            [instance.doctor.user],
            'New appointment assigned',
            f'{instance.patient.full_name} booked a {instance.date:%b %d} appointment with you at {instance.time:%I:%M %p}.',
            link,
        )
        notify_admins(
            'Appointment booked',
            f'{instance.patient.full_name} booked an appointment with {instance.doctor} on {instance.date:%b %d}.',
            link,
        )
    elif instance.status == Appointment.Status.CANCELLED:
        notify_admins(
            'Appointment cancelled',
            f'{instance.patient.full_name} cancelled their {instance.date:%b %d} appointment with {instance.doctor}.',
            reverse('appointments:list'),
        )


@receiver(post_save, sender=Invoice)
def invoice_notifications(sender, instance, created, **kwargs):
    if created:
        link = reverse('billing:detail', args=[instance.pk])
        message = f'{instance.invoice_no} issued to {instance.patient.full_name} for ${instance.total:,.2f}.'
        notify_admins('Invoice created', message, link)
        notify_receptionists('Invoice created', message, link)
