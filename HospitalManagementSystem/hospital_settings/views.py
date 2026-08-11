from django.contrib import messages
from django.urls import reverse_lazy
from django.views.generic import UpdateView

from accounts.mixins import RoleRequiredMixin
from hospital_settings.forms import HospitalSettingsForm
from hospital_settings.models import HospitalSettings


class HospitalSettingsView(RoleRequiredMixin, UpdateView):
    model = HospitalSettings
    form_class = HospitalSettingsForm
    template_name = 'hospital_settings/form.html'
    roles = ('admin',)
    success_url = reverse_lazy('hospital_settings:index')

    def get_object(self, queryset=None):
        return HospitalSettings.get_settings()

    def form_valid(self, form):
        messages.success(self.request, 'Hospital settings updated.')
        return super().form_valid(form)
