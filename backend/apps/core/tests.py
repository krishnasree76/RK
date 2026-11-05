from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.categories.models import Category
from apps.products.models import Product

from .testing import make_image_file
from .validators import validate_image_extension, validate_image_size


class ImageValidatorTests(TestCase):
    def test_rejects_non_image_extension(self):
        with self.assertRaises(ValidationError):
            validate_image_extension(make_image_file(name="malware.exe"))

    def test_accepts_allowed_extensions(self):
        for name in ("a.jpg", "a.jpeg", "a.png", "a.webp"):
            validate_image_extension(make_image_file(name=name))

    @override_settings(MAX_IMAGE_UPLOAD_MB=0)
    def test_rejects_oversized_file(self):
        with self.assertRaises(ValidationError):
            validate_image_size(make_image_file())


class AdminAccessTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Car Lighting")
        Product.objects.create(name="LED Bulb", category=category, price_per_piece="120.00", description="Bright.")

    def test_admin_requires_login(self):
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("admin:login"), response["Location"])

    def test_non_staff_user_cannot_access_admin(self):
        user = get_user_model().objects.create_user("buyer", password="not-used-elsewhere-123")
        self.client.force_login(user)
        response = self.client.get(reverse("admin:products_product_changelist"))
        self.assertEqual(response.status_code, 302)

    def test_admin_pages_render_for_superuser(self):
        admin = get_user_model().objects.create_superuser("owner", "owner@example.com", "not-used-elsewhere-123")
        self.client.force_login(admin)
        product = Product.objects.get()
        for url in (
            reverse("admin:index"),
            reverse("admin:categories_category_changelist"),
            reverse("admin:categories_category_add"),
            reverse("admin:categories_category_change", args=[product.category_id]),
            reverse("admin:products_product_changelist"),
            reverse("admin:products_product_changelist") + "?q=LED",
            reverse("admin:products_product_add"),
            reverse("admin:products_product_change", args=[product.pk]),
            reverse("admin:products_product_changelist") + "?stock_status=out",
            reverse("admin:orders_order_changelist"),
            reverse("admin:auth_user_changelist"),
            reverse("admin:auth_user_change", args=[admin.pk]),
        ):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                self.assertContains(response, "RK ENTERPRICES DELHI")
