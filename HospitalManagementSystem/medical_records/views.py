from django.shortcuts import get_object_or_404
from django.urls import reverse_lazy
from django.views.generic import CreateView, DetailView, ListView

from accounts.mixins import RoleRequiredMixin
from medical_records.forms import MedicalRecordForm
from medical_records.models import MedicalRecord
from patients.models import Patient


class MedicalRecordListView(RoleRequiredMixin, ListView):
    model = MedicalRecord
    template_name = 'medical_records/list.html'
    context_object_name = 'records'
    paginate_by = 15

    def get_queryset(self):
        self.patient = get_patient(self.kwargs['patient_id'])
        return MedicalRecord.objects.filter(patient=self.patient).select_related('doctor__user', 'appointment')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['patient'] = self.patient
        return context


class MedicalRecordCreateView(RoleRequiredMixin, CreateView):
    model = MedicalRecord
    form_class = MedicalRecordForm
    template_name = 'medical_records/form.html'
    roles = ('admin', 'doctor')

    def dispatch(self, request, *args, **kwargs):
        self.patient = get_patient(self.kwargs['patient_id'])
        return super().dispatch(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['patient'] = self.patient
        return context

    def form_valid(self, form):
        record = form.save(commit=False)
        record.patient = self.patient
        if self.request.user.is_doctor():
            record.doctor = getattr(self.request.user, 'doctor_profile', None)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('medical_records:patient_records', kwargs={'patient_id': self.patient.pk})


class MedicalRecordDetailView(RoleRequiredMixin, DetailView):
    model = MedicalRecord
    template_name = 'medical_records/detail.html'
    context_object_name = 'record'

    def get_queryset(self):
        return MedicalRecord.objects.select_related('patient', 'doctor__user', 'appointment')


def get_patient(patient_id):
    return get_object_or_404(Patient, pk=patient_id)
