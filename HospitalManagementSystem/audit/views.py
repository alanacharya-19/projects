from django.db.models import Q
from django.views.generic import ListView

from accounts.mixins import RoleRequiredMixin
from audit.models import AuditLog


class AuditLogListView(RoleRequiredMixin, ListView):
    model = AuditLog
    template_name = 'audit/list.html'
    context_object_name = 'logs'
    paginate_by = 25
    roles = ('admin',)

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        action = self.request.GET.get('action', '').strip()
        model = self.request.GET.get('model', '').strip()
        q = self.request.GET.get('q', '').strip()
        if action:
            qs = qs.filter(action=action)
        if model:
            qs = qs.filter(model_name=model)
        if q:
            qs = qs.filter(
                Q(user__username__icontains=q)
                | Q(object_repr__icontains=q)
                | Q(app_label__icontains=q)
            )
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_action'] = self.request.GET.get('action', '')
        context['filter_model'] = self.request.GET.get('model', '')
        context['action_choices'] = AuditLog.Action.choices
        context['model_choices'] = sorted(
            AuditLog.objects.values_list('model_name', flat=True).distinct()
        )
        return context
