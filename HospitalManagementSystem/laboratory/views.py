from django.contrib import messages
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from accounts.mixins import RoleRequiredMixin
from laboratory.forms import LabResultForm, LabTestOrderForm, LabTestTypeForm
from laboratory.models import LabTestItem, LabTestOrder, LabTestType
from notifications.utils import notify_admins, notify_receptionists, notify_users


class LabTestTypeListView(RoleRequiredMixin, ListView):
    model = LabTestType
    template_name = 'laboratory/type_list.html'
    context_object_name = 'test_types'
    paginate_by = 20
    roles = ('admin', 'doctor')

    def get_queryset(self):
        qs = LabTestType.objects.all()
        q = self.request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(code__icontains=q) | Q(category__icontains=q))
        return qs


class LabTestTypeCreateView(RoleRequiredMixin, CreateView):
    model = LabTestType
    form_class = LabTestTypeForm
    template_name = 'laboratory/type_form.html'
    roles = ('admin',)
    success_url = reverse_lazy('laboratory:type_list')

    def form_valid(self, form):
        messages.success(self.request, f'{form.instance.name} added to the lab catalog.')
        return super().form_valid(form)


class LabTestTypeUpdateView(RoleRequiredMixin, UpdateView):
    model = LabTestType
    form_class = LabTestTypeForm
    template_name = 'laboratory/type_form.html'
    roles = ('admin',)

    def get_success_url(self):
        return reverse('laboratory:type_list')

    def form_valid(self, form):
        messages.success(self.request, f'{form.instance.name} updated.')
        return super().form_valid(form)


class LabTestTypeDeleteView(RoleRequiredMixin, DeleteView):
    model = LabTestType
    template_name = 'laboratory/type_confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('laboratory:type_list')

    def form_valid(self, form):
        messages.success(self.request, f'{self.object.name} removed from the catalog.')
        return super().form_valid(form)


class LabTestOrderListView(RoleRequiredMixin, ListView):
    model = LabTestOrder
    template_name = 'laboratory/order_list.html'
    context_object_name = 'orders'
    paginate_by = 15

    def get_queryset(self):
        qs = LabTestOrder.objects.select_related('patient', 'doctor__user')
        if self.request.user.is_doctor():
            profile = getattr(self.request.user, 'doctor_profile', None)
            if profile:
                qs = qs.filter(doctor=profile)
        status = self.request.GET.get('status', '').strip()
        q = self.request.GET.get('q', '').strip()
        if status:
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(Q(patient__full_name__icontains=q) | Q(order_no__icontains=q))
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_status'] = self.request.GET.get('status', '')
        context['status_choices'] = LabTestOrder.Status.choices
        return context


class LabTestOrderCreateView(RoleRequiredMixin, CreateView):
    model = LabTestOrder
    form_class = LabTestOrderForm
    template_name = 'laboratory/order_form.html'
    roles = ('admin', 'doctor')
    success_url = reverse_lazy('laboratory:order_list')

    def form_valid(self, form):
        form.instance.ordered_by = self.request.user
        if self.request.user.is_doctor():
            form.instance.doctor = getattr(self.request.user, 'doctor_profile', None)
        self.object = form.save()
        for test_type in form.cleaned_data['test_types']:
            LabTestItem.objects.create(
                order=self.object,
                test_type=test_type,
                reference_range=test_type.reference_range,
            )
        message = f'{self.object.order_no} ordered for {self.object.patient.full_name} (${self.object.total:,.2f}).'
        link = reverse('laboratory:order_detail', args=[self.object.pk])
        notify_admins('Lab order created', message, link)
        notify_receptionists('Lab order created', message, link)
        messages.success(self.request, f'Lab order {self.object.order_no} created.')
        return super().form_valid(form)


class LabTestOrderDetailView(RoleRequiredMixin, DetailView):
    model = LabTestOrder
    template_name = 'laboratory/order_detail.html'
    context_object_name = 'order'

    def get_queryset(self):
        return LabTestOrder.objects.select_related('patient', 'doctor__user', 'appointment', 'ordered_by')


class LabTestOrderCancelView(RoleRequiredMixin, View):
    roles = ('admin',)

    def post(self, request, *args, **kwargs):
        order = get_object_or_404(LabTestOrder, pk=self.kwargs['pk'])
        if order.status == LabTestOrder.Status.CANCELLED:
            messages.warning(request, f'{order.order_no} is already cancelled.')
        else:
            order.status = LabTestOrder.Status.CANCELLED
            order.save(update_fields=['status', 'updated_at'])
            order.items.update(status=LabTestItem.Status.CANCELLED)
            notify_admins(
                'Lab order cancelled',
                f'{order.order_no} for {order.patient.full_name} was cancelled.',
                reverse('laboratory:order_detail', args=[order.pk]),
            )
            messages.success(request, f'{order.order_no} cancelled.')
        return redirect('laboratory:order_detail', pk=order.pk)


class LabTestItemResultView(RoleRequiredMixin, UpdateView):
    model = LabTestItem
    form_class = LabResultForm
    template_name = 'laboratory/item_result.html'
    roles = ('admin', 'doctor')

    def form_valid(self, form):
        self.object.mark_completed(
            self.request.user,
            form.cleaned_data['result'],
            form.cleaned_data['notes'],
            form.cleaned_data.get('reference_range') or None,
        )
        order = self.object.order
        if order.status not in (LabTestOrder.Status.COMPLETED, LabTestOrder.Status.CANCELLED):
            order.status = LabTestOrder.Status.IN_PROGRESS
            order.save(update_fields=['status', 'updated_at'])
        if order.doctor:
            notify_users(
                [order.doctor.user],
                'Lab result ready',
                f'Result for {self.object.test_type.name} on {order.order_no} is ready.',
                reverse('laboratory:order_detail', args=[order.pk]),
            )
        notify_admins(
            'Lab result entered',
            f'{self.object.test_type.name} result entered for {order.patient.full_name} on {order.order_no}.',
            reverse('laboratory:order_detail', args=[order.pk]),
        )
        messages.success(self.request, f'Result saved for {self.object.test_type.name}.')
        return redirect('laboratory:order_detail', pk=order.pk)

    def get_initial(self):
        initial = super().get_initial()
        if not self.object.reference_range:
            initial['reference_range'] = self.object.test_type.reference_range
        return initial


class LabTestItemCancelView(RoleRequiredMixin, View):
    roles = ('admin',)

    def post(self, request, *args, **kwargs):
        item = get_object_or_404(LabTestItem, pk=self.kwargs['pk'])
        item.status = LabTestItem.Status.CANCELLED
        item.save(update_fields=['status'])
        messages.success(request, f'{item.test_type.name} cancelled on {item.order.order_no}.')
        return redirect('laboratory:order_detail', pk=item.order.pk)
