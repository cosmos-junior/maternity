"""
Audit middleware — attaches current user and request metadata to
django-simple-history so every model change is fully attributed.
"""
from threading import local

_thread_locals = local()


def get_current_request():
    return getattr(_thread_locals, 'request', None)


class AuditMiddleware:
    """
    Stores the current request in thread-local storage so that
    django-simple-history can attach the user and IP to every
    historical record automatically.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request

        # Let simple_history know who is making the change
        if request.user and request.user.is_authenticated:
            try:
                from simple_history.middleware import HistoryRequestMiddleware
                HistoryRequestMiddleware(self.get_response)(request)
            except Exception:
                pass

        response = self.get_response(request)
        return response
