from django.urls import path

from medical_records import views

app_name = 'medical_records'

urlpatterns = [
    path('patient/<int:patient_id>/', views.MedicalRecordListView.as_view(), name='patient_records'),
    path('patient/<int:patient_id>/add/', views.MedicalRecordCreateView.as_view(), name='add'),
    path('<int:pk>/', views.MedicalRecordDetailView.as_view(), name='detail'),
]
