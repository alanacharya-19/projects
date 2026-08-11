from django.urls import path

from admissions import views

app_name = 'admissions'

urlpatterns = [
    path('', views.AdmissionListView.as_view(), name='admission_list'),
    path('new/', views.AdmissionCreateView.as_view(), name='admission_create'),
    path('<int:pk>/', views.AdmissionDetailView.as_view(), name='admission_detail'),
    path('<int:pk>/discharge/', views.AdmissionDischargeView.as_view(), name='admission_discharge'),
    path('<int:pk>/transfer/', views.AdmissionTransferView.as_view(), name='admission_transfer'),
    path('<int:pk>/cancel/', views.AdmissionCancelView.as_view(), name='admission_cancel'),
    path('rooms/', views.RoomListView.as_view(), name='room_list'),
    path('rooms/add/', views.RoomCreateView.as_view(), name='room_add'),
    path('rooms/<int:pk>/edit/', views.RoomUpdateView.as_view(), name='room_edit'),
    path('rooms/<int:pk>/delete/', views.RoomDeleteView.as_view(), name='room_delete'),
]
