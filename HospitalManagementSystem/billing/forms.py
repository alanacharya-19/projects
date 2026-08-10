from django import forms
from django.forms import inlineformset_factory
from django.forms.models import BaseInlineFormSet

from appointments.models import Appointment
from billing.models import Invoice, InvoiceItem
from patients.models import Patient


class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['patient', 'appointment', 'discount', 'tax', 'due_date', 'notes', 'payment_method']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-control'}),
            'appointment': forms.Select(attrs={'class': 'form-control'}),
            'discount': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'tax': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'payment_method': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['patient'].queryset = Patient.objects.order_by('full_name')
        self.fields['appointment'].queryset = Appointment.objects.filter(
            status=Appointment.Status.COMPLETED,
        ).select_related('patient', 'doctor__user').order_by('-date')


class BaseInvoiceItemFormSet(BaseInlineFormSet):
    def add_fields(self, form, index):
        super().add_fields(form, index)
        for name in ('quantity',):
            if name in form.fields:
                # Prevent the model field default from marking blank extra rows
                # as "changed", which would otherwise fail inline formset validation.
                form.fields[name].initial = None


InvoiceItemFormSet = inlineformset_factory(
    Invoice,
    InvoiceItem,
    formset=BaseInvoiceItemFormSet,
    fields=['description', 'quantity', 'unit_price'],
    extra=3,
    can_delete=True,
    widgets={
        'description': forms.TextInput(attrs={'class': 'form-control'}),
        'quantity': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        'unit_price': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
    },
)


class InvoicePaymentForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['paid_amount', 'payment_method']
        widgets = {
            'paid_amount': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'step': '0.01'}),
            'payment_method': forms.Select(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['paid_amount'].initial = 0
