from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, ListView, UpdateView

from accounts.mixins import RoleRequiredMixin
from departments.forms import DepartmentForm
from departments.models import Department


class DepartmentListView(RoleRequiredMixin, ListView):
    model = Department
    template_name = 'departments/list.html'
    context_object_name = 'departments'
    roles = ('admin',)
    paginate_by = 10


class DepartmentCreateView(RoleRequiredMixin, CreateView):
    model = Department
    form_class = DepartmentForm
    template_name = 'departments/form.html'
    roles = ('admin',)
    success_url = reverse_lazy('departments:list')


class DepartmentUpdateView(RoleRequiredMixin, UpdateView):
    model = Department
    form_class = DepartmentForm
    template_name = 'departments/form.html'
    roles = ('admin',)
    success_url = reverse_lazy('departments:list')


class DepartmentDeleteView(RoleRequiredMixin, DeleteView):
    model = Department
    template_name = 'departments/confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('departments:list')
