from django import forms

from doctors.models import Doctor
from medical_records.models import MedicalRecord


class MedicalRecordForm(forms.ModelForm):
    doctor = forms.ModelChoiceField(
        queryset=Doctor.objects.select_related('user').order_by('user__first_name'),
        required=False,
        label='Doctor',
        widget=forms.Select(attrs={'class': 'form-control'}),
    )

    class Meta:
        model = MedicalRecord
        fields = ['doctor', 'diagnosis', 'prescription', 'doctor_notes']
        widgets = {
            'diagnosis': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'prescription': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'doctor_notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if self.user and self.user.is_doctor():
            profile = getattr(self.user, 'doctor_profile', None)
            self.fields['doctor'].required = False
            self.fields['doctor'].disabled = True
            if profile:
                self.fields['doctor'].initial = profile.pk
