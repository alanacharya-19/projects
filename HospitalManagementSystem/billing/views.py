from django.contrib import messages
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView, View

from accounts.mixins import RoleRequiredMixin
from appointments.models import Appointment
from billing.forms import InvoiceForm, InvoiceItemFormSet, InvoicePaymentForm
from billing.models import Invoice
from hospital.export import csv_response


class InvoiceListView(RoleRequiredMixin, ListView):
    model = Invoice
    template_name = 'billing/list.html'
    context_object_name = 'invoices'
    paginate_by = 15

    def get_queryset(self):
        qs = Invoice.objects.select_related('patient', 'created_by').all()
        status = self.request.GET.get('status', '').strip()
        q = self.request.GET.get('q', '').strip()
        if status:
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(
                Q(patient__full_name__icontains=q)
                | Q(invoice_no__icontains=q)
            )
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_status'] = self.request.GET.get('status', '')
        context['status_choices'] = Invoice.Status.choices
        context['total_outstanding'] = sum(
            (i.balance for i in Invoice.objects.filter(status__in=['pending', 'partial'])),
            0,
        )
        return context


class InvoiceCreateView(RoleRequiredMixin, CreateView):
    model = Invoice
    form_class = InvoiceForm
    template_name = 'billing/form.html'
    roles = ('admin', 'receptionist')
    success_url = reverse_lazy('billing:list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.POST:
            context['items_formset'] = InvoiceItemFormSet(self.request.POST)
        else:
            context['items_formset'] = InvoiceItemFormSet()
        return context

    def get_initial(self):
        initial = super().get_initial()
        appointment_pk = self.request.GET.get('appointment', '')
        if appointment_pk:
            appointment = Invoice._meta.get_field('appointment').remote_field.model.objects.filter(
                pk=appointment_pk,
                status=Appointment.Status.COMPLETED,
            ).first()
            if appointment:
                initial['appointment'] = appointment
                initial['patient'] = appointment.patient
        return initial

    def form_valid(self, form):
        context = self.get_context_data()
        items_formset = context['items_formset']
        if not items_formset.is_valid():
            return self.render_to_response(self.get_context_data(form=form))
        form.instance.created_by = self.request.user
        self.object = form.save()
        items_formset.instance = self.object
        items_formset.save()
        messages.success(self.request, f'Invoice {self.object.invoice_no} created.')
        return super().form_valid(form)


class InvoiceUpdateView(RoleRequiredMixin, UpdateView):
    model = Invoice
    form_class = InvoiceForm
    template_name = 'billing/form.html'
    roles = ('admin',)
    success_url = reverse_lazy('billing:list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.POST:
            context['items_formset'] = InvoiceItemFormSet(self.request.POST, instance=self.object)
        else:
            context['items_formset'] = InvoiceItemFormSet(instance=self.object)
        return context

    def form_valid(self, form):
        context = self.get_context_data()
        items_formset = context['items_formset']
        if not items_formset.is_valid():
            return self.render_to_response(self.get_context_data(form=form))
        self.object = form.save()
        items_formset.instance = self.object
        items_formset.save()
        messages.success(self.request, f'Invoice {self.object.invoice_no} updated.')
        return super().form_valid(form)


class InvoiceDetailView(RoleRequiredMixin, DetailView):
    model = Invoice
    template_name = 'billing/detail.html'
    context_object_name = 'invoice'

    def get_queryset(self):
        return Invoice.objects.select_related('patient', 'appointment', 'created_by').prefetch_related('items')


class InvoicePayView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')
    template_name = 'billing/pay.html'

    def get(self, request, *args, **kwargs):
        invoice = self.get_invoice()
        form = InvoicePaymentForm(instance=invoice)
        return render_pay(request, invoice, form, self.template_name)

    def post(self, request, *args, **kwargs):
        invoice = self.get_invoice()
        if invoice.is_settled:
            messages.warning(request, f'{invoice.invoice_no} is already settled.')
            return redirect('billing:detail', pk=invoice.pk)
        form = InvoicePaymentForm(request.POST, instance=invoice)
        if form.is_valid():
            amount = form.cleaned_data['paid_amount']
            invoice.paid_amount = (invoice.paid_amount or 0) + amount
            invoice.payment_method = form.cleaned_data['payment_method']
            if invoice.paid_amount >= invoice.total:
                invoice.status = Invoice.Status.PAID
            elif invoice.paid_amount > 0:
                invoice.status = Invoice.Status.PARTIAL
            invoice.save()
            messages.success(self.request, f'Payment recorded for {invoice.invoice_no}.')
            return redirect('billing:detail', pk=invoice.pk)
        return render_pay(request, invoice, form, self.template_name)

    def get_invoice(self):
        return get_object_or_404(Invoice, pk=self.kwargs['pk'])


class InvoiceCancelView(RoleRequiredMixin, View):
    roles = ('admin',)
    template_name = 'billing/confirm_cancel.html'

    def get(self, request, *args, **kwargs):
        return render_cancel(request, self.get_invoice(), self.template_name)

    def post(self, request, *args, **kwargs):
        invoice = self.get_invoice()
        if not invoice.is_settled:
            invoice.status = Invoice.Status.CANCELLED
            invoice.save(update_fields=['status', 'updated_at'])
            messages.success(self.request, f'Invoice {invoice.invoice_no} cancelled.')
        return redirect('billing:list')

    def get_invoice(self):
        return get_object_or_404(Invoice, pk=self.kwargs['pk'])


class InvoiceDeleteView(RoleRequiredMixin, DeleteView):
    model = Invoice
    template_name = 'billing/confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('billing:list')

    def form_valid(self, form):
        messages.success(self.request, f'Invoice {self.object.invoice_no} deleted.')
        return super().form_valid(form)


def render_pay(request, invoice, form, template_name):
    return render_paged(request, template_name, {'invoice': invoice, 'form': form})


def render_cancel(request, invoice, template_name):
    return render_paged(request, template_name, {'invoice': invoice})


def render_paged(request, template_name, context):
    from django.shortcuts import render
    return render(request, template_name, context)


class InvoiceExportView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')

    def get(self, request, *args, **kwargs):
        qs = Invoice.objects.select_related('patient').all()
        status = request.GET.get('status', '').strip()
        q = request.GET.get('q', '').strip()
        if status:
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(
                Q(patient__full_name__icontains=q)
                | Q(invoice_no__icontains=q)
            )
        rows = [[
            inv.invoice_no, inv.patient.full_name, inv.created_at.date(),
            inv.total, inv.paid_amount, inv.balance, inv.get_status_display(),
            inv.get_payment_method_display(),
        ] for inv in qs]
        return csv_response(
            'invoices.csv',
            ['Invoice No', 'Patient', 'Date', 'Total', 'Paid', 'Balance', 'Status', 'Method'],
            rows,
        )
