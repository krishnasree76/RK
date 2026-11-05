from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    # Absolute URL (request in context) or null when no image is uploaded.
    image = serializers.ImageField(read_only=True, use_url=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image", "product_count"]


class CategorySummarySerializer(serializers.ModelSerializer):
    """Compact form embedded in product responses."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug"]
