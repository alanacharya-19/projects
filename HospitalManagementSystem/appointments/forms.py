from django import forms
from django.utils import timezone

from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient


class AppointmentForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = ['patient', 'doctor', 'date', 'time', 'reason']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-control'}),
            'doctor': forms.Select(attrs={'class': 'form-control'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'time': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
            'reason': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['patient'].queryset = Patient.objects.order_by('full_name')
        self.fields['doctor'].queryset = Doctor.objects.select_related('user').filter(
            user__is_active=True,
        ).order_by('user__first_name')

    def clean_date(self):
        date = self.cleaned_data['date']
        if date < timezone.localdate():
            raise forms.ValidationError('Appointment date cannot be in the past.')
        return date

    def clean(self):
        cleaned = super().clean()
        doctor = cleaned.get('doctor')
        date = cleaned.get('date')
        time = cleaned.get('time')

        if doctor and date and time:
            conflict = Appointment.objects.filter(
                doctor=doctor,
                date=date,
                time=time,
                status=Appointment.Status.SCHEDULED,
            )
            if self.instance and self.instance.pk:
                conflict = conflict.exclude(pk=self.instance.pk)
            if conflict.exists():
                raise forms.ValidationError(
                    f'{doctor} already has a scheduled appointment at {time:%H:%M} on {date}.'
                )
        return cleaned
