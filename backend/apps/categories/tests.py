from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.core.testing import TempMediaMixin, make_image_file
from apps.products.models import Product

from .models import Category


class CategoryModelTests(TempMediaMixin, TestCase):
    def test_slug_generated_from_name(self):
        category = Category.objects.create(name="Wheels & Tyres")
        self.assertEqual(category.slug, "wheels-tyres")

    def test_duplicate_names_get_unique_slugs(self):
        first = Category.objects.create(name="Car Care")
        second = Category.objects.create(name="Car Care")
        self.assertEqual(first.slug, "car-care")
        self.assertEqual(second.slug, "car-care-2")

    def test_manual_slug_is_normalised_and_collision_safe(self):
        Category.objects.create(name="Lighting", slug="car-lighting")
        edited = Category.objects.create(name="Other", slug="Car Lighting")
        self.assertEqual(edited.slug, "car-lighting-2")

    def test_resaving_keeps_own_slug(self):
        category = Category.objects.create(name="Interior Accessories")
        category.description = "Updated"
        category.save()
        self.assertEqual(category.slug, "interior-accessories")

    def test_admin_form_validation_reports_slug_collision(self):
        Category.objects.create(name="Car Care")
        duplicate = Category(name="Another", slug="car-care")
        with self.assertRaises(ValidationError) as ctx:
            duplicate.full_clean()
        self.assertIn("slug", ctx.exception.message_dict)

    def test_ordering_by_display_order_then_name(self):
        Category.objects.create(name="Zeta", sort_order=1)
        Category.objects.create(name="Beta", sort_order=2)
        Category.objects.create(name="Alpha", sort_order=2)
        self.assertEqual(list(Category.objects.values_list("name", flat=True)), ["Zeta", "Alpha", "Beta"])

    def test_timestamps_set_automatically(self):
        category = Category.objects.create(name="Car Electronics")
        self.assertIsNotNone(category.created_at)
        self.assertIsNotNone(category.updated_at)

    def test_image_upload_goes_to_categories_folder(self):
        category = Category.objects.create(name="Car Lighting", image=make_image_file("Head Light.PNG"))
        self.assertTrue(category.image.name.startswith("categories/car-lighting-"))
        self.assertTrue(category.image.name.endswith(".png"))
        self.assertTrue(category.image.storage.exists(category.image.name))

    def test_invalid_image_type_fails_validation(self):
        category = Category(name="Bad", image=make_image_file("document.pdf"))
        with self.assertRaises(ValidationError) as ctx:
            category.full_clean()
        self.assertIn("image", ctx.exception.message_dict)

    def test_category_with_products_cannot_be_deleted(self):
        from django.db.models import ProtectedError

        category = Category.objects.create(name="Car Care")
        Product.objects.create(name="Shampoo", category=category, price_per_piece="10", description="Foam.")
        with self.assertRaises(ProtectedError):
            category.delete()


class CategoryApiTests(TempMediaMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wheels = Category.objects.create(
            name="Wheels & Tyres", description="Wholesale wheels and tyre accessories.", sort_order=1
        )
        cls.lighting = Category.objects.create(name="Car Lighting", sort_order=2)
        Product.objects.create(name="Inflator", category=cls.wheels, price_per_piece="500", description="12V.")

    def test_list_returns_plain_array_in_display_order(self):
        response = self.client.get("/api/v1/categories/")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        self.assertEqual([c["slug"] for c in response.json()], ["wheels-tyres", "car-lighting"])

    def test_category_json_format(self):
        data = self.client.get("/api/v1/categories/wheels-tyres/").json()
        self.assertEqual(
            data,
            {
                "id": self.wheels.id,
                "name": "Wheels & Tyres",
                "slug": "wheels-tyres",
                "description": "Wholesale wheels and tyre accessories.",
                "image": None,
                "product_count": 1,
            },
        )

    def test_image_url_is_absolute(self):
        self.lighting.image = make_image_file("lamp.jpg", fmt="JPEG", content_type="image/jpeg")
        self.lighting.save()
        data = self.client.get("/api/v1/categories/car-lighting/").json()
        self.assertTrue(data["image"].startswith("http://testserver/media/categories/car-lighting-"))

    def test_unknown_slug_returns_404_json(self):
        response = self.client.get("/api/v1/categories/does-not-exist/")
        self.assertEqual(response.status_code, 404)
        self.assertIn("detail", response.json())

    def test_api_is_read_only(self):
        for method in ("post", "put", "patch", "delete"):
            with self.subTest(method=method):
                url = "/api/v1/categories/" if method == "post" else "/api/v1/categories/wheels-tyres/"
                response = getattr(self.client, method)(url, {"name": "Hacked"}, format="json")
                self.assertEqual(response.status_code, 405)
        self.assertEqual(Category.objects.count(), 2)

    def test_cors_allows_local_frontend(self):
        response = self.client.get("/api/v1/categories/", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")

    def test_cors_rejects_unknown_origin(self):
        response = self.client.get("/api/v1/categories/", HTTP_ORIGIN="https://evil.example.com")
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)
