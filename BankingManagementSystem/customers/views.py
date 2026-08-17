from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from customers.serializers import CustomerSerializer, RegisterSerializer


@extend_schema(request=RegisterSerializer, responses={201: CustomerSerializer})
class RegisterView(APIView):
    """Public endpoint for creating a user and their customer profile."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(
            CustomerSerializer(customer).data,
            status=status.HTTP_201_CREATED,
        )


class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """Customers can read their own profile; staff can read everything."""

    serializer_class = CustomerSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Customer.objects.none()
        user = self.request.user
        if user.is_staff:
            return Customer.objects.select_related("user").all()
        return Customer.objects.filter(user=user).select_related("user")

    @action(detail=False, methods=["get"])
    def me(self, request):
        try:
            customer = Customer.objects.select_related("user").get(user=request.user)
        except Customer.DoesNotExist:
            return Response(
                {"detail": "No customer profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(CustomerSerializer(customer).data)
