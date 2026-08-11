from django.contrib import messages
from django.db.models import ProtectedError, Q
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from admissions.forms import AdmissionForm, RoomForm, TransferForm
from admissions.models import Admission, Room
from accounts.mixins import RoleRequiredMixin


class RoomListView(RoleRequiredMixin, ListView):
    model = Room
    template_name = 'admissions/room_list.html'
    context_object_name = 'rooms'
    paginate_by = 20

    def get_queryset(self):
        qs = Room.objects.all()
        q = self.request.GET.get('q', '').strip()
        room_type = self.request.GET.get('room_type', '').strip()
        if q:
            qs = qs.filter(Q(room_number__icontains=q) | Q(floor__icontains=q))
        if room_type:
            qs = qs.filter(room_type=room_type)
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_room_type'] = self.request.GET.get('room_type', '')
        context['room_type_choices'] = Room.RoomType.choices
        context['available_count'] = Room.objects.filter(status=Room.Status.AVAILABLE).count()
        context['occupied_count'] = Room.objects.filter(status=Room.Status.OCCUPIED).count()
        context['maintenance_count'] = Room.objects.filter(status=Room.Status.MAINTENANCE).count()
        return context


class RoomCreateView(RoleRequiredMixin, CreateView):
    model = Room
    form_class = RoomForm
    template_name = 'admissions/room_form.html'
    roles = ('admin',)
    success_url = reverse_lazy('admissions:room_list')

    def form_valid(self, form):
        messages.success(self.request, f'Room {form.instance.room_number} added.')
        return super().form_valid(form)


class RoomUpdateView(RoleRequiredMixin, UpdateView):
    model = Room
    form_class = RoomForm
    template_name = 'admissions/room_form.html'
    roles = ('admin',)

    def get_success_url(self):
        return reverse('admissions:room_list')

    def form_valid(self, form):
        messages.success(self.request, f'Room {form.instance.room_number} updated.')
        return super().form_valid(form)


class RoomDeleteView(RoleRequiredMixin, DeleteView):
    model = Room
    template_name = 'admissions/room_confirm_delete.html'
    roles = ('admin',)
    success_url = reverse_lazy('admissions:room_list')

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        try:
            return super().post(request, *args, **kwargs)
        except ProtectedError:
            messages.error(
                request,
                f'Room {self.object.room_number} cannot be deleted because it has admissions.',
            )
            return redirect('admissions:room_list')


class AdmissionListView(RoleRequiredMixin, ListView):
    model = Admission
    template_name = 'admissions/admission_list.html'
    context_object_name = 'admissions'
    paginate_by = 15

    def get_queryset(self):
        qs = Admission.objects.select_related('patient', 'room', 'assigned_doctor__user')
        if self.request.user.is_doctor():
            profile = getattr(self.request.user, 'doctor_profile', None)
            if profile:
                qs = qs.filter(assigned_doctor=profile)
        status = self.request.GET.get('status', '').strip()
        q = self.request.GET.get('q', '').strip()
        if status:
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(Q(patient__full_name__icontains=q) | Q(admission_no__icontains=q))
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter_status'] = self.request.GET.get('status', '')
        context['status_choices'] = Admission.Status.choices
        context['active_count'] = Admission.objects.filter(status=Admission.Status.ADMITTED).count()
        return context


class AdmissionCreateView(RoleRequiredMixin, CreateView):
    model = Admission
    form_class = AdmissionForm
    template_name = 'admissions/admission_form.html'
    roles = ('admin', 'receptionist')
    success_url = reverse_lazy('admissions:admission_list')

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        self.object = form.save()
        self.object.room.refresh_status()
        messages.success(self.request, f'{self.object.admission_no} created for {self.object.patient.full_name}.')
        return super().form_valid(form)


class AdmissionDetailView(RoleRequiredMixin, DetailView):
    model = Admission
    template_name = 'admissions/admission_detail.html'
    context_object_name = 'admission'

    def get_queryset(self):
        return Admission.objects.select_related('patient', 'room', 'assigned_doctor__user', 'created_by')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['transfer_form'] = TransferForm()
        return context


class AdmissionDischargeView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')

    def post(self, request, *args, **kwargs):
        admission = get_object_or_404(Admission, pk=self.kwargs['pk'])
        if admission.status != Admission.Status.ADMITTED:
            messages.warning(request, f'{admission.admission_no} is not currently admitted.')
        else:
            admission.discharge()
            messages.success(request, f'{admission.admission_no} discharged.')
        return redirect('admissions:admission_detail', pk=admission.pk)


class AdmissionTransferView(RoleRequiredMixin, View):
    roles = ('admin', 'receptionist')

    def post(self, request, *args, **kwargs):
        admission = get_object_or_404(Admission, pk=self.kwargs['pk'])
        if admission.status != Admission.Status.ADMITTED:
            messages.warning(request, f'{admission.admission_no} is not currently admitted.')
            return redirect('admissions:admission_detail', pk=admission.pk)
        form = TransferForm(request.POST)
        if form.is_valid():
            new_room = form.cleaned_data['room']
            try:
                admission.transfer(new_room)
                messages.success(request, f'{admission.admission_no} moved to {new_room.room_number}.')
            except ValueError as exc:
                messages.error(request, str(exc))
        else:
            messages.error(request, 'Please select a valid room for the transfer.')
        return redirect('admissions:admission_detail', pk=admission.pk)


class AdmissionCancelView(RoleRequiredMixin, View):
    roles = ('admin',)

    def post(self, request, *args, **kwargs):
        admission = get_object_or_404(Admission, pk=self.kwargs['pk'])
        if admission.status == Admission.Status.CANCELLED:
            messages.warning(request, f'{admission.admission_no} is already cancelled.')
        else:
            admission.status = Admission.Status.CANCELLED
            admission.save(update_fields=['status', 'updated_at'])
            admission.room.refresh_status()
            messages.success(request, f'{admission.admission_no} cancelled.')
        return redirect('admissions:admission_detail', pk=admission.pk)
