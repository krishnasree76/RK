from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response

from apps.accounts.models import CustomerProfile
from apps.accounts.serializers import get_profile

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer
from .services import place_order


class OrderViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Signed-in customers only.
    POST /api/v1/orders/            {items: [{product: <slug>, quantity}], phone, notes}
    GET  /api/v1/orders/            the customer's own orders
    GET  /api/v1/orders/<number>/   one of the customer's orders
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = "number"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order = place_order(user=request.user, lines=data["items"], phone=data["phone"], notes=data.get("notes", ""))

        # Remember the phone number on the customer's profile if they don't have one yet.
        profile = get_profile(request.user)
        if not profile.phone and not CustomerProfile.objects.filter(phone=data["phone"]).exists():
            profile.phone = data["phone"]
            profile.save(update_fields=["phone", "updated_at"])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
