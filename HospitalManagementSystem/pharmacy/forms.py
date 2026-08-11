from django import forms
from django.forms import inlineformset_factory
from django.forms.models import BaseInlineFormSet

from pharmacy.models import Medicine, Prescription, PrescriptionItem


class MedicineForm(forms.ModelForm):
    class Meta:
        model = Medicine
        fields = [
            'name', 'generic_name', 'category', 'unit', 'price',
            'stock_quantity', 'reorder_level', 'batch_number',
            'expiry_date', 'supplier', 'is_active',
        ]
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'generic_name': forms.TextInput(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'unit': forms.TextInput(attrs={'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'stock_quantity': forms.NumberInput(attrs={'class': 'form-control', 'min': 0}),
            'reorder_level': forms.NumberInput(attrs={'class': 'form-control', 'min': 0}),
            'batch_number': forms.TextInput(attrs={'class': 'form-control'}),
            'expiry_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'supplier': forms.TextInput(attrs={'class': 'form-control'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class BasePrescriptionItemFormSet(BaseInlineFormSet):
    def add_fields(self, form, index):
        super().add_fields(form, index)
        for name in ('quantity', 'duration_days'):
            if name in form.fields:
                form.fields[name].initial = None


PrescriptionItemFormSet = inlineformset_factory(
    Prescription,
    PrescriptionItem,
    formset=BasePrescriptionItemFormSet,
    fields=['medicine', 'dosage', 'frequency', 'duration_days', 'quantity', 'instructions'],
    extra=3,
    can_delete=True,
    widgets={
        'medicine': forms.Select(attrs={'class': 'form-control'}),
        'dosage': forms.TextInput(attrs={'class': 'form-control'}),
        'frequency': forms.TextInput(attrs={'class': 'form-control'}),
        'duration_days': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        'quantity': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        'instructions': forms.TextInput(attrs={'class': 'form-control'}),
    },
)


class PrescriptionForm(forms.ModelForm):
    class Meta:
        model = Prescription
        fields = ['patient', 'medical_record', 'status', 'notes']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-control'}),
            'medical_record': forms.Select(attrs={'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from medical_records.models import MedicalRecord
        self.fields['patient'].queryset = self.fields['patient'].queryset.order_by('full_name')
        self.fields['medical_record'].queryset = MedicalRecord.objects.select_related('patient').order_by('-created_at')


class StockAdjustForm(forms.Form):
    quantity = forms.IntegerField(
        min_value=1,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
    )
    reason = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. New shipment received'}),
    )
