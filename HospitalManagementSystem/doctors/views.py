from django.contrib import messages
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from accounts.mixins import RoleRequiredMixin
from doctors.forms import DoctorForm
from doctors.models import Doctor
from hospital.export import csv_response


class DoctorListView(RoleRequiredMixin, ListView):
    model = Doctor
    template_name = 'doctors/list.html'
    context_object_name = 'doctors'
    paginate_by = 10

    def get_queryset(self):
        qs = Doctor.objects.select_related('user', 'department').all()
        q = self.request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(user__first_name__icontains=q)
                | Q(user__last_name__icontains=q)
                | Q(specialty__icontains=q)
                | Q(department__name__icontains=q)
            )
        return qs


class DoctorCreateView(RoleRequiredMixin, CreateView):
    model = Doctor
    form_class = DoctorForm
    template_name = 'doctors/form.html'
    roles = ('admin',)
    success_url = reverse_lazy('doctors:list')


class DoctorUpdateView(RoleRequiredMixin, UpdateView):
    model = Doctor
    form_class = DoctorForm
    template_name = 'doctors/form.html'
    roles = ('admin',)
    success_url = reverse_lazy('doctors:list')


class DoctorDeleteView(RoleRequiredMixin, DeleteView):
    model = Doctor
    template_name = 'doctors/confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('doctors:list')

    def form_valid(self, form):
        try:
            self.object.user.delete()
            return super().form_valid(form)
        except ProtectedError:
            messages.error(
                self.request,
                f'Cannot delete {self.object.full_name}: they have scheduled or past '
                'appointments on record. Cancel them first.',
            )
            return redirect('doctors:profile', pk=self.object.pk)


class DoctorDetailView(RoleRequiredMixin, DetailView):
    model = Doctor
    template_name = 'doctors/profile.html'
    context_object_name = 'doctor'

    def get_queryset(self):
        return Doctor.objects.select_related('user', 'department')


class DoctorExportView(RoleRequiredMixin, View):
    roles = ('admin',)

    def get(self, request, *args, **kwargs):
        qs = Doctor.objects.select_related('user', 'department').all()
        q = request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(user__first_name__icontains=q)
                | Q(user__last_name__icontains=q)
                | Q(specialty__icontains=q)
                | Q(department__name__icontains=q)
            )
        rows = [[
            d.full_name, d.specialty, d.department.name if d.department else '',
            d.license_no, d.experience_years, d.consultation_fee,
            'Available' if d.is_available else 'Unavailable',
        ] for d in qs]
        return csv_response(
            'doctors.csv',
            ['Doctor', 'Specialty', 'Department', 'License No', 'Experience (yrs)', 'Fee', 'Status'],
            rows,
        )
