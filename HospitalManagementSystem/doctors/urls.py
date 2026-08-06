from django.urls import path

from doctors import views

app_name = 'doctors'

urlpatterns = [
    path('', views.DoctorListView.as_view(), name='list'),
    path('add/', views.DoctorCreateView.as_view(), name='add'),
    path('<int:pk>/', views.DoctorDetailView.as_view(), name='profile'),
    path('<int:pk>/edit/', views.DoctorUpdateView.as_view(), name='edit'),
    path('<int:pk>/delete/', views.DoctorDeleteView.as_view(), name='delete'),
]
