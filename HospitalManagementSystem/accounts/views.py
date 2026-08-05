from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy


class RoleAwareLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        user = self.request.user
        if user.is_doctor():
            return reverse_lazy('dashboard:index')
        if user.is_receptionist():
            return reverse_lazy('dashboard:index')
        return reverse_lazy('dashboard:index')


class HospitalLogoutView(LogoutView):
    next_page = reverse_lazy('accounts:login')
