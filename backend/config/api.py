from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.categories.views import CategoryViewSet
from apps.orders.views import OrderViewSet
from apps.products.views import ProductViewSet

# Versioned public API under /api/v1/.
# Catalogue endpoints are read-only and public; orders and account endpoints
# require a signed-in customer (token authentication).
router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("", include("apps.accounts.urls")),
    path("", include(router.urls)),
]
