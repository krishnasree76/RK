from rest_framework import serializers

from apps.categories.serializers import CategorySummarySerializer

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySummarySerializer(read_only=True)
    image = serializers.ImageField(read_only=True, use_url=True)
    # Decimal rendered as a string ("850.00") so the frontend never does
    # floating-point arithmetic on prices.
    price_per_piece = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    # Effective minimum: the product's minimum quantity, or 1 when none is set.
    min_order_quantity = serializers.IntegerField(source="minimum_quantity", read_only=True)
    in_stock = serializers.BooleanField(source="can_be_ordered", read_only=True)
    features = serializers.ListField(source="feature_list", child=serializers.CharField(), read_only=True)
    specifications = serializers.ListField(source="specification_list", child=serializers.DictField(), read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "price_per_piece",
            "has_minimum_order",
            "min_order_quantity",
            "stock",
            "in_stock",
            "description",
            "features",
            "specifications",
            "image",
            "is_featured",
        ]


class OrderLineSerializer(serializers.Serializer):
    """
    One line of an order. Enforces each product's minimum quantity server-side,
    never only in React. Stock is re-checked under a row lock when the order is placed.
    """

    product = serializers.SlugRelatedField(slug_field="slug", queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        product, minimum = attrs["product"], attrs["product"].minimum_quantity
        if attrs["quantity"] < minimum:
            raise serializers.ValidationError(
                {"quantity": f"Minimum order quantity for {product.name} is {minimum} pieces."}
            )
        return attrs
