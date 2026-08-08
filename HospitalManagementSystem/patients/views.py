from django.contrib import messages
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from accounts.mixins import RoleRequiredMixin
from patients.forms import PatientForm
from patients.models import Patient


class PatientListView(RoleRequiredMixin, ListView):
    model = Patient
    template_name = 'patients/list.html'
    context_object_name = 'patients'
    paginate_by = 10

    def get_queryset(self):
        qs = Patient.objects.select_related('created_by').all()
        q = self.request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(full_name__icontains=q)
                | Q(phone__icontains=q)
                | Q(email__icontains=q)
                | Q(blood_group__icontains=q)
            )
        return qs


class PatientCreateView(RoleRequiredMixin, CreateView):
    model = Patient
    form_class = PatientForm
    template_name = 'patients/form.html'
    roles = ('admin', 'receptionist')
    success_url = reverse_lazy('patients:list')

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class PatientUpdateView(RoleRequiredMixin, UpdateView):
    model = Patient
    form_class = PatientForm
    template_name = 'patients/form.html'
    roles = ('admin', 'receptionist')
    success_url = reverse_lazy('patients:list')


class PatientDeleteView(RoleRequiredMixin, DeleteView):
    model = Patient
    template_name = 'patients/confirm_delete.html'
    roles = ('admin', 'receptionist')
    success_url = reverse_lazy('patients:list')

    def form_valid(self, form):
        try:
            return super().form_valid(form)
        except ProtectedError as exc:
            messages.error(
                self.request,
                f'Cannot delete {self.object.full_name}: they have related '
                'appointments or medical records. Cancel appointments first.',
            )
            return redirect('patients:detail', pk=self.object.pk)


class PatientDetailView(RoleRequiredMixin, DetailView):
    model = Patient
    template_name = 'patients/detail.html'
    context_object_name = 'patient'

    def get_queryset(self):
        return Patient.objects.select_related('created_by')
