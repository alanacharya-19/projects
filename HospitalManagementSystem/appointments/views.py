from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, FormView, ListView

from accounts.mixins import RoleRequiredMixin
from appointments.forms import AppointmentForm
from appointments.models import Appointment
from doctors.models import Doctor
from hospital.export import csv_response
from medical_records.forms import MedicalRecordForm
from medical_records.models import MedicalRecord


class AppointmentListView(RoleRequiredMixin, ListView):
    model = Appointment
    template_name = 'appointments/list.html'
    context_object_name = 'appointments'
    paginate_by = 15

    def get_queryset(self):
        qs = Appointment.objects.select_related(
            'patient', 'doctor__user', 'doctor__department',
        )
        if self.request.user.is_doctor():
            qs = qs.filter(doctor__user=self.request.user)

        doctor = self.request.GET.get('doctor', '').strip()
        date = self.request.GET.get('date', '').strip()
        status = self.request.GET.get('status', '').strip()

        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if date:
            qs = qs.filter(date=date)
        if status:
            qs = qs.filter(status=status)
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_doctor'] = self.request.GET.get('doctor', '')
        context['filter_date'] = self.request.GET.get('date', '')
        context['filter_status'] = self.request.GET.get('status', '')
        context['status_choices'] = Appointment.Status.choices
        context['doctors'] = Doctor.objects.select_related('user').order_by('user__first_name')
        return context


class AppointmentCreateView(RoleRequiredMixin, CreateView):
    model = Appointment
    form_class = AppointmentForm
    template_name = 'appointments/form.html'
    roles = ('admin', 'receptionist')
    success_url = reverse_lazy('appointments:list')

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class AppointmentCancelView(RoleRequiredMixin, View):
    template_name = 'appointments/confirm_cancel.html'
    roles = ('admin', 'receptionist', 'doctor')

    def get(self, request, *args, **kwargs):
        appointment = self.get_appointment()
        return render(request, self.template_name, {'appointment': appointment})

    def post(self, request, *args, **kwargs):
        appointment = self.get_appointment()
        if appointment.is_scheduled:
            appointment.status = Appointment.Status.CANCELLED
            appointment.save(update_fields=['status', 'updated_at'])
        return redirect('appointments:list')

    def get_appointment(self):
        appointment = get_object_or_404(
            Appointment,
            pk=self.kwargs['pk'],
        )
        if self.request.user.is_doctor() and appointment.doctor.user_id != self.request.user.pk:
            raise PermissionDenied
        return appointment


class AppointmentCompleteView(RoleRequiredMixin, FormView):
    form_class = MedicalRecordForm
    template_name = 'appointments/complete.html'
    roles = ('admin', 'doctor')
    success_url = reverse_lazy('appointments:list')

    def dispatch(self, request, *args, **kwargs):
        self.appointment = self.get_appointment()
        user = request.user
        if user.is_doctor() and self.appointment.doctor.user_id != user.pk:
            raise PermissionDenied
        if not self.appointment.is_scheduled:
            raise PermissionDenied
        return super().dispatch(request, *args, **kwargs)

    def get_appointment(self):
        return get_object_or_404(
            Appointment.objects.select_related('patient', 'doctor__user'),
            pk=self.kwargs['pk'],
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['appointment'] = self.appointment
        return context

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        record = form.save(commit=False)
        record.patient = self.appointment.patient
        record.doctor = self.appointment.doctor
        record.appointment = self.appointment
        record.save()
        self.appointment.status = Appointment.Status.COMPLETED
        self.appointment.save(update_fields=['status', 'updated_at'])
        return super().form_valid(form)


class AppointmentExportView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')

    def get(self, request, *args, **kwargs):
        qs = Appointment.objects.select_related(
            'patient', 'doctor__user', 'doctor__department',
        ).all()
        doctor = request.GET.get('doctor', '').strip()
        date = request.GET.get('date', '').strip()
        status = request.GET.get('status', '').strip()
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if date:
            qs = qs.filter(date=date)
        if status:
            qs = qs.filter(status=status)
        rows = [[
            a.patient.full_name, a.doctor.full_name, a.date, a.time.strftime('%I:%M %p'),
            a.reason, a.get_status_display(),
        ] for a in qs]
        return csv_response(
            'appointments.csv',
            ['Patient', 'Doctor', 'Date', 'Time', 'Reason', 'Status'],
            rows,
        )
