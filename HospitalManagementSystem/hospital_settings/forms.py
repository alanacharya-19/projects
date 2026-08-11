from django import forms

from hospital_settings.models import HospitalSettings


class HospitalSettingsForm(forms.ModelForm):
    class Meta:
        model = HospitalSettings
        fields = [
            'hospital_name', 'tagline', 'address', 'phone', 'email',
            'currency', 'working_hours', 'footer_text',
        ]
        widgets = {
            'hospital_name': forms.TextInput(attrs={'class': 'form-control'}),
            'tagline': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.TextInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'currency': forms.TextInput(attrs={'class': 'form-control', 'maxlength': 10}),
            'working_hours': forms.TextInput(attrs={'class': 'form-control'}),
            'footer_text': forms.TextInput(attrs={'class': 'form-control'}),
        }
