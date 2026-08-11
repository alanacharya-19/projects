"""Middleware that captures the active request for signal-based audit logging."""
import contextvars

_current_request = contextvars.ContextVar('audit_current_request', default=None)


class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = _current_request.set(request)
        try:
            return self.get_response(request)
        finally:
            _current_request.reset(token)


def get_current_request():
    return _current_request.get()
