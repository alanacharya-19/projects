from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, response, views


@extend_schema(responses={200: OpenApiTypes.OBJECT})
class HomeView(views.APIView):
    """Public landing page for the API."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = {
            "name": "Banking Management System API",
            "version": "1.0.0",
            "documentation": request.build_absolute_uri("/api/schema/"),
            "login": request.build_absolute_uri("/api/auth/login/"),
            "endpoints": {
                "customers": request.build_absolute_uri("/api/customers/"),
                "accounts": request.build_absolute_uri("/api/accounts/"),
                "transactions": request.build_absolute_uri("/api/transactions/"),
            },
        }
        return response.Response(data)
