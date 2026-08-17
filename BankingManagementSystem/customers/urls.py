from django.urls import path

from customers.views import RegisterView

urlpatterns = [
    path("", RegisterView.as_view(), name="register"),
]
