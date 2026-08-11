from django import forms

from admissions.models import Admission, Room


class RoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = ['room_number', 'floor', 'room_type', 'rate_per_day', 'capacity', 'status', 'notes']
        widgets = {
            'room_number': forms.TextInput(attrs={'class': 'form-control'}),
            'floor': forms.TextInput(attrs={'class': 'form-control'}),
            'room_type': forms.Select(attrs={'class': 'form-control'}),
            'rate_per_day': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'capacity': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'notes': forms.TextInput(attrs={'class': 'form-control'}),
        }


class AdmissionForm(forms.ModelForm):
    class Meta:
        model = Admission
        fields = ['patient', 'room', 'assigned_doctor', 'reason', 'expected_discharge', 'notes']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-control'}),
            'room': forms.Select(attrs={'class': 'form-control'}),
            'assigned_doctor': forms.Select(attrs={'class': 'form-control'}),
            'reason': forms.TextInput(attrs={'class': 'form-control'}),
            'expected_discharge': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['patient'].queryset = self.fields['patient'].queryset.order_by('full_name')
        self.fields['assigned_doctor'].required = False
        self.fields['room'].queryset = Room.objects.exclude(status=Room.Status.MAINTENANCE).order_by('room_number')

    def clean_room(self):
        room = self.cleaned_data.get('room')
        if room and room.is_full:
            raise forms.ValidationError(f'{room.room_number} is currently full.')
        return room


class TransferForm(forms.Form):
    room = forms.ModelChoiceField(
        queryset=Room.objects.exclude(status=Room.Status.MAINTENANCE).order_by('room_number'),
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='Transfer to room',
    )
