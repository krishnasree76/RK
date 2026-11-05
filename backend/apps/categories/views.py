from django.db.models import Count
from rest_framework import viewsets

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/categories/          all categories (unpaginated — a short list)
    GET /api/v1/categories/<slug>/   one category
    """

    serializer_class = CategorySerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        # Explicit order_by: Django ignores Meta.ordering on aggregated querysets.
        return Category.objects.annotate(product_count=Count("products")).order_by("sort_order", "name")
