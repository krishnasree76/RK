from rest_framework import filters, viewsets

from .models import Product
from .serializers import ProductSerializer

TRUTHY = {"1", "true", "yes"}
MAX_SLUGS = 100


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/products/                      paginated list
        ?category=<slug>                       filter by category slug
        ?search=<text>                         name / description / category name
        ?featured=true                         homepage featured products
        ?slugs=a,b,c                           specific products (used to refresh the Order List)
        ?page=2&page_size=12                   pagination
    GET /api/v1/products/<slug>/               one product
    """

    serializer_class = ProductSerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description", "category__name"]

    def get_queryset(self):
        queryset = Product.objects.select_related("category")
        if self.action != "list":
            return queryset

        params = self.request.query_params
        category = params.get("category", "").strip()
        if category:
            queryset = queryset.filter(category__slug=category)
        if params.get("featured", "").strip().lower() in TRUTHY:
            queryset = queryset.filter(is_featured=True)
        slugs = [s.strip() for s in params.get("slugs", "").split(",") if s.strip()][:MAX_SLUGS]
        if slugs:
            queryset = queryset.filter(slug__in=slugs)
        return queryset
