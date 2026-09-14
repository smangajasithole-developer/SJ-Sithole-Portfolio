from django.utils.deprecation import MiddlewareMixin
from django.shortcuts import render
from django.conf import settings


class NoCacheMiddleware(MiddlewareMixin):

    def process_response(self, request, response):

        if request.path.startswith("/admin") or request.user.is_authenticated:
            response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"

        return response


class MaintenanceModeMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        # ALWAYS ALLOW LOGIN PAGE
        if request.path.startswith('/admin_login'):
            return self.get_response(request)

        # ALWAYS ALLOW DJANGO ADMIN
        if request.path.startswith('/admin'):
            return self.get_response(request)

        # STAFF / SUPERUSER BYPASS
        if request.user.is_authenticated:
            if request.user.is_staff or request.user.is_superuser:
                return self.get_response(request)

        # MAINTENANCE MODE
        if getattr(settings, "MAINTENANCE_MODE", False):
            return render(request, "maintenance.html", status=503)

        return self.get_response(request)