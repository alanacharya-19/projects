from django.urls import path

from pharmacy import views

app_name = 'pharmacy'

urlpatterns = [
    path('', views.MedicineListView.as_view(), name='medicine_list'),
    path('medicines/add/', views.MedicineCreateView.as_view(), name='medicine_add'),
    path('medicines/<int:pk>/', views.MedicineDetailView.as_view(), name='medicine_detail'),
    path('medicines/<int:pk>/edit/', views.MedicineUpdateView.as_view(), name='medicine_edit'),
    path('medicines/<int:pk>/delete/', views.MedicineDeleteView.as_view(), name='medicine_delete'),
    path('medicines/<int:pk>/stock/', views.MedicineStockAdjustView.as_view(), name='medicine_stock'),
    path('prescriptions/', views.PrescriptionListView.as_view(), name='prescription_list'),
    path('prescriptions/new/', views.PrescriptionCreateView.as_view(), name='prescription_create'),
    path('prescriptions/<int:pk>/', views.PrescriptionDetailView.as_view(), name='prescription_detail'),
    path('prescriptions/<int:pk>/dispense/', views.PrescriptionDispenseView.as_view(), name='prescription_dispense'),
    path('prescriptions/<int:pk>/delete/', views.PrescriptionDeleteView.as_view(), name='prescription_delete'),
]
