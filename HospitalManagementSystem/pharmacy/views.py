from django.contrib import messages
from django.db.models import Q
from django.shortcuts import redirect
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from accounts.mixins import RoleRequiredMixin
from medical_records.models import MedicalRecord
from pharmacy.forms import (
    MedicineForm, PrescriptionForm, PrescriptionItemFormSet, StockAdjustForm,
)
from pharmacy.models import Medicine, Prescription, StockMovement


class MedicineListView(RoleRequiredMixin, ListView):
    model = Medicine
    template_name = 'pharmacy/medicine_list.html'
    context_object_name = 'medicines'
    paginate_by = 15

    def get_queryset(self):
        qs = Medicine.objects.all()
        q = self.request.GET.get('q', '').strip()
        low = self.request.GET.get('low', '') == '1'
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(generic_name__icontains=q) | Q(batch_number__icontains=q))
        if low:
            qs = [m for m in qs if m.is_low_stock]
            return qs
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['low_only'] = self.request.GET.get('low', '') == '1'
        context['total_items'] = Medicine.objects.count()
        context['low_stock_count'] = sum(1 for m in Medicine.objects.all() if m.is_low_stock)
        context['stock_value'] = sum((m.stock_value for m in Medicine.objects.all()), 0)
        return context


class MedicineDetailView(RoleRequiredMixin, DetailView):
    model = Medicine
    template_name = 'pharmacy/medicine_detail.html'
    context_object_name = 'medicine'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['movements'] = self.object.stock_movements.select_related('user')[:20]
        context['adjust_form'] = StockAdjustForm()
        return context


class MedicineCreateView(RoleRequiredMixin, CreateView):
    model = Medicine
    form_class = MedicineForm
    template_name = 'pharmacy/medicine_form.html'
    roles = ('admin',)
    success_url = reverse_lazy('pharmacy:medicine_list')

    def form_valid(self, form):
        messages.success(self.request, f'{form.instance.name} added to the pharmacy.')
        return super().form_valid(form)


class MedicineUpdateView(RoleRequiredMixin, UpdateView):
    model = Medicine
    form_class = MedicineForm
    template_name = 'pharmacy/medicine_form.html'
    roles = ('admin',)

    def get_success_url(self):
        return reverse('pharmacy:medicine_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, f'{form.instance.name} updated.')
        return super().form_valid(form)


class MedicineDeleteView(RoleRequiredMixin, DeleteView):
    model = Medicine
    template_name = 'pharmacy/medicine_confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('pharmacy:medicine_list')

    def form_valid(self, form):
        messages.success(self.request, f'{self.object.name} removed from the pharmacy.')
        return super().form_valid(form)


class MedicineStockAdjustView(RoleRequiredMixin, View):
    roles = ('admin',)

    def post(self, request, *args, **kwargs):
        medicine = Medicine.objects.get(pk=self.kwargs['pk'])
        form = StockAdjustForm(request.POST)
        if form.is_valid():
            medicine.stock_quantity += form.cleaned_data['quantity']
            medicine.save(update_fields=['stock_quantity', 'updated_at'])
            StockMovement.objects.create(
                medicine=medicine,
                quantity=form.cleaned_data['quantity'],
                reason=form.cleaned_data['reason'],
                user=request.user,
            )
            messages.success(request, f'{form.cleaned_data["quantity"]} units added to {medicine.name}.')
        return redirect('pharmacy:medicine_detail', pk=medicine.pk)


class PrescriptionListView(RoleRequiredMixin, ListView):
    model = Prescription
    template_name = 'pharmacy/prescription_list.html'
    context_object_name = 'prescriptions'
    paginate_by = 15

    def get_queryset(self):
        qs = Prescription.objects.select_related('patient', 'doctor__user')
        if self.request.user.is_doctor():
            profile = getattr(self.request.user, 'doctor_profile', None)
            if profile:
                qs = qs.filter(doctor=profile)
        status = self.request.GET.get('status', '').strip()
        q = self.request.GET.get('q', '').strip()
        if status:
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(Q(patient__full_name__icontains=q) | Q(prescription_no__icontains=q))
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_status'] = self.request.GET.get('status', '')
        context['status_choices'] = Prescription.Status.choices
        return context


class PrescriptionCreateView(RoleRequiredMixin, CreateView):
    model = Prescription
    form_class = PrescriptionForm
    template_name = 'pharmacy/prescription_form.html'
    roles = ('admin', 'doctor')
    success_url = reverse_lazy('pharmacy:prescription_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.POST:
            context['items_formset'] = PrescriptionItemFormSet(self.request.POST)
        else:
            context['items_formset'] = PrescriptionItemFormSet()
        return context

    def get_initial(self):
        initial = super().get_initial()
        record_pk = self.request.GET.get('record', '')
        if record_pk:
            record = MedicalRecord.objects.filter(pk=record_pk).select_related('patient', 'doctor').first()
            if record:
                initial['medical_record'] = record
                initial['patient'] = record.patient
        return initial

    def form_valid(self, form):
        context = self.get_context_data()
        items_formset = context['items_formset']
        if not items_formset.is_valid():
            return self.render_to_response(self.get_context_data(form=form))
        form.instance.created_by = self.request.user
        if self.request.user.is_doctor():
            form.instance.doctor = getattr(self.request.user, 'doctor_profile', None)
        self.object = form.save()
        items_formset.instance = self.object
        items_formset.save()
        messages.success(self.request, f'Prescription {self.object.prescription_no} created.')
        return super().form_valid(form)


class PrescriptionDetailView(RoleRequiredMixin, DetailView):
    model = Prescription
    template_name = 'pharmacy/prescription_detail.html'
    context_object_name = 'prescription'

    def get_queryset(self):
        return Prescription.objects.select_related('patient', 'doctor__user', 'medical_record', 'created_by')


class PrescriptionDispenseView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')

    def post(self, request, *args, **kwargs):
        prescription = Prescription.objects.get(pk=self.kwargs['pk'])
        if prescription.status != Prescription.Status.ACTIVE:
            messages.warning(request, f'{prescription.prescription_no} is not active.')
            return redirect('pharmacy:prescription_detail', pk=prescription.pk)
        try:
            prescription.dispense(request.user)
            messages.success(request, f'{prescription.prescription_no} dispensed and stock updated.')
        except ValueError as exc:
            messages.error(request, str(exc))
        return redirect('pharmacy:prescription_detail', pk=prescription.pk)


class PrescriptionDeleteView(RoleRequiredMixin, DeleteView):
    model = Prescription
    template_name = 'pharmacy/prescription_confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('pharmacy:prescription_list')

    def form_valid(self, form):
        messages.success(self.request, f'{self.object.prescription_no} deleted.')
        return super().form_valid(form)
