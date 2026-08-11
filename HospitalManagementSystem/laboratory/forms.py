from django import forms

from laboratory.models import LabTestItem, LabTestOrder, LabTestType


class LabTestTypeForm(forms.ModelForm):
    class Meta:
        model = LabTestType
        fields = ['name', 'code', 'category', 'price', 'reference_range', 'description', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'code': forms.TextInput(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'reference_range': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class LabTestOrderForm(forms.ModelForm):
    test_types = forms.ModelMultipleChoiceField(
        queryset=LabTestType.objects.filter(is_active=True).order_by('name'),
        widget=forms.SelectMultiple(attrs={'class': 'form-control', 'size': 8}),
        label='Tests',
    )

    class Meta:
        model = LabTestOrder
        fields = ['patient', 'doctor', 'appointment', 'clinical_notes']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-control'}),
            'doctor': forms.Select(attrs={'class': 'form-control'}),
            'appointment': forms.Select(attrs={'class': 'form-control'}),
            'clinical_notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['patient'].queryset = self.fields['patient'].queryset.order_by('full_name')
        self.fields['doctor'].required = False
        self.fields['appointment'].queryset = self.fields['appointment'].queryset.select_related('patient')


class LabResultForm(forms.ModelForm):
    class Meta:
        model = LabTestItem
        fields = ['result', 'reference_range', 'notes']
        widgets = {
            'result': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Enter result value(s)...'}),
            'reference_range': forms.TextInput(attrs={'class': 'form-control'}),
            'notes': forms.TextInput(attrs={'class': 'form-control'}),
        }
