from django.contrib.auth.mixins import LoginRequiredMixin


class RoleRequiredMixin(LoginRequiredMixin):
    roles = ()

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return self.handle_no_permission()
        if self.roles and request.user.role not in self.roles:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied
        return super().dispatch(request, *args, **kwargs)
