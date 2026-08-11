from django.urls import path

from hospital_settings import views

app_name = 'hospital_settings'

urlpatterns = [
    path('', views.HospitalSettingsView.as_view(), name='index'),
]
