from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.core.validators import normalize_phone
from apps.products.serializers import OrderLineSerializer

from .models import Order, OrderItem

MAX_LINES = 50


class OrderCreateSerializer(serializers.Serializer):
    items = OrderLineSerializer(many=True)
    phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Your order list is empty.")
        if len(items) > MAX_LINES:
            raise serializers.ValidationError(f"An order can have at most {MAX_LINES} products.")
        return items

    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from exc


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product_slug", "product_name", "unit_price", "quantity", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "number",
            "status",
            "status_label",
            "created_at",
            "customer_name",
            "phone",
            "email",
            "total_quantity",
            "total_amount",
            "notes",
            "lr_number",
            "items",
        ]
