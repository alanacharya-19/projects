from django.urls import path

from accounts import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.RoleAwareLoginView.as_view(), name='login'),
    path('logout/', views.HospitalLogoutView.as_view(), name='logout'),
]
