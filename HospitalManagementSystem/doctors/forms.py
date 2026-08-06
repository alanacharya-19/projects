from django import forms
from django.contrib.auth import get_user_model

from doctors.models import Doctor

User = get_user_model()


class DoctorForm(forms.ModelForm):
    username = forms.CharField(
        max_length=150,
        label='Username',
        widget=forms.TextInput(attrs={'class': 'form-control'}),
    )
    first_name = forms.CharField(
        max_length=150,
        label='First name',
        widget=forms.TextInput(attrs={'class': 'form-control'}),
    )
    last_name = forms.CharField(
        max_length=150,
        label='Last name',
        widget=forms.TextInput(attrs={'class': 'form-control'}),
    )
    email = forms.EmailField(
        required=False,
        widget=forms.EmailInput(attrs={'class': 'form-control'}),
    )
    password = forms.CharField(
        required=False,
        label='Password (leave blank to keep unchanged)',
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
    )

    class Meta:
        model = Doctor
        fields = [
            'department', 'specialty', 'license_no', 'experience_years',
            'consultation_fee', 'bio', 'profile_picture', 'is_available',
        ]
        widgets = {
            'department': forms.Select(attrs={'class': 'form-control'}),
            'specialty': forms.TextInput(attrs={'class': 'form-control'}),
            'license_no': forms.TextInput(attrs={'class': 'form-control'}),
            'experience_years': forms.NumberInput(attrs={'class': 'form-control', 'min': 0}),
            'consultation_fee': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'bio': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'profile_picture': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'is_available': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def _existing_user(self):
        """Return the linked user when editing, else None."""
        if self.instance and self.instance.pk:
            return self.instance.user
        return None

    def clean_username(self):
        username = self.cleaned_data['username']
        user = self._existing_user()
        qs = User.objects.filter(username=username)
        if user and user.username == username:
            return username
        if qs.exists():
            raise forms.ValidationError('A user with this username already exists.')
        return username

    def clean(self):
        cleaned = super().clean()
        if self.instance and self.instance.pk and cleaned.get('password') and self.instance.user:
            cleaned['_existing_user'] = self.instance.user
        return cleaned

    def save(self, commit=True):
        doctor = super().save(commit=False)
        password = self.cleaned_data.get('password')
        user = self._existing_user()

        if user:
            user.username = self.cleaned_data['username']
            user.first_name = self.cleaned_data['first_name']
            user.last_name = self.cleaned_data['last_name']
            user.email = self.cleaned_data['email']
            if password:
                user.set_password(password)
            user.save()
        else:
            user = User.objects.create_user(
                username=self.cleaned_data['username'],
                password=password or User.objects.make_random_password(),
                email=self.cleaned_data['email'],
                first_name=self.cleaned_data['first_name'],
                last_name=self.cleaned_data['last_name'],
                role=User.Role.DOCTOR,
                is_staff=True,
            )
        doctor.user = user
        if commit:
            doctor.save()
            self.save_m2m()
        return doctor
