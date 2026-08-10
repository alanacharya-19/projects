from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect
from django.views import View
from django.views.generic import ListView

from accounts.mixins import RoleRequiredMixin
from notifications.models import Notification


class NotificationListView(RoleRequiredMixin, ListView):
    model = Notification
    template_name = 'notifications/list.html'
    context_object_name = 'notifications'
    paginate_by = 20

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['unread_count'] = self.request.user.notifications.filter(is_read=False).count()
        return context


class NotificationMarkReadView(RoleRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        notification = get_object_or_404(
            Notification,
            pk=self.kwargs['pk'],
            recipient=request.user,
        )
        notification.mark_read()
        if notification.link:
            return redirect(notification.link)
        return redirect('notifications:list')


class NotificationMarkAllReadView(RoleRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        messages.success(request, 'All notifications marked as read.')
        return redirect('notifications:list')
