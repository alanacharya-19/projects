from django.db.models import Q
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from accounts.mixins import RoleRequiredMixin
from doctors.forms import DoctorForm
from doctors.models import Doctor


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
        self.object.user.delete()
        return super().form_valid(form)


class DoctorDetailView(RoleRequiredMixin, DetailView):
    model = Doctor
    template_name = 'doctors/profile.html'
    context_object_name = 'doctor'

    def get_queryset(self):
        return Doctor.objects.select_related('user', 'department')
