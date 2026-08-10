from django.urls import path

from appointments import views

app_name = 'appointments'

urlpatterns = [
    path('', views.AppointmentListView.as_view(), name='list'),
    path('book/', views.AppointmentCreateView.as_view(), name='book'),
    path('<int:pk>/cancel/', views.AppointmentCancelView.as_view(), name='cancel'),
    path('<int:pk>/complete/', views.AppointmentCompleteView.as_view(), name='complete'),
    path('export/', views.AppointmentExportView.as_view(), name='export'),
]
