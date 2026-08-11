from django.db import models


class HospitalSettings(models.Model):
    """Singleton holding editable hospital-wide settings shown across the UI."""

    hospital_name = models.CharField(max_length=150, default='MediCare Hospital')
    tagline = models.CharField(max_length=200, blank=True)
    address = models.CharField(max_length=250, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    currency = models.CharField(max_length=10, default='$')
    working_hours = models.CharField(max_length=100, blank=True, help_text='e.g. Mon-Sat, 9:00 AM - 6:00 PM')
    footer_text = models.CharField(max_length=250, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Hospital settings'
        verbose_name_plural = 'Hospital settings'

    def __str__(self):
        return self.hospital_name

    @classmethod
    def get_settings(cls):
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings
