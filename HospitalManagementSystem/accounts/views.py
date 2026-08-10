from django.contrib import messages
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.views import LoginView, LogoutView, PasswordChangeView
from django.core.cache import cache
from django.urls import reverse_lazy
from django.views.generic import UpdateView

from accounts.forms import ChangePasswordForm, ProfileForm

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60


def _lockout_key(username):
    return f'login_lockout:{username.strip().lower()}'


def _is_locked(username):
    attempts = cache.get(_lockout_key(username), 0)
    return attempts >= MAX_FAILED_ATTEMPTS


class RoleAwareLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

    def dispatch(self, request, *args, **kwargs):
        if request.method == 'POST' and not request.user.is_authenticated:
            username = request.POST.get('username', '')
            if username and _is_locked(username):
                messages.error(
                    request,
                    'Too many failed attempts. This account is temporarily locked for 15 minutes.',
                )
                form = self.get_form()
                return self.render_to_response(self.get_context_data(form=form))
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        username = form.cleaned_data.get('username', '')
        if username:
            cache.delete(_lockout_key(username))
        return super().form_valid(form)

    def form_invalid(self, form):
        username = form.cleaned_data.get('username') or self.request.POST.get('username', '')
        if username:
            key = _lockout_key(username)
            attempts = cache.get(key, 0) + 1
            cache.set(key, attempts, LOCKOUT_SECONDS)
            if attempts >= MAX_FAILED_ATTEMPTS:
                messages.error(
                    self.request,
                    'Too many failed attempts. This account is temporarily locked for 15 minutes.',
                )
        return super().form_invalid(form)

    def get_success_url(self):
        redirect_to = self.request.POST.get(REDIRECT_FIELD_NAME) or self.request.GET.get(REDIRECT_FIELD_NAME)
        if redirect_to:
            return redirect_to
        return reverse_lazy('dashboard:index')


class HospitalLogoutView(LogoutView):
    next_page = reverse_lazy('accounts:login')


class ProfileUpdateView(UpdateView):
    template_name = 'accounts/profile.html'
    form_class = ProfileForm
    success_url = reverse_lazy('accounts:profile')

    def get_object(self, queryset=None):
        return self.request.user

    def form_valid(self, form):
        messages.success(self.request, 'Your profile has been updated.')
        return super().form_valid(form)


class ChangePasswordView(PasswordChangeView):
    template_name = 'accounts/change_password.html'
    form_class = ChangePasswordForm
    success_url = reverse_lazy('accounts:profile')

    def form_valid(self, form):
        messages.success(self.request, 'Your password has been changed.')
        return super().form_valid(form)
