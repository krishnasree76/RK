from decimal import Decimal
from io import StringIO

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.core.testing import TempMediaMixin, make_image_file

from .models import Product
from .serializers import OrderLineSerializer


def make_product(category, name="LED Headlight Bulbs", **extra):
    defaults = {"price_per_piece": Decimal("850.00"), "description": "Bright white LED bulbs."}
    defaults.update(extra)
    return Product.objects.create(name=name, category=category, **defaults)


class ProductModelTests(TempMediaMixin, TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="Car Lighting")

    def test_create_product_with_category(self):
        product = make_product(self.category)
        self.assertEqual(product.slug, "led-headlight-bulbs")
        self.assertEqual(product.category, self.category)
        self.assertEqual(list(self.category.products.all()), [product])

    def test_unique_slugs(self):
        first = make_product(self.category, name="Fog Lamp")
        second = make_product(self.category, name="Fog Lamp")
        self.assertNotEqual(first.slug, second.slug)
        self.assertEqual(second.slug, "fog-lamp-2")

    def test_price_is_decimal(self):
        product = make_product(self.category, price_per_piece="19.99")
        product.refresh_from_db()
        self.assertIsInstance(product.price_per_piece, Decimal)
        self.assertEqual(product.price_per_piece, Decimal("19.99"))

    def test_negative_price_fails_validation(self):
        product = Product(name="Bad", category=self.category, price_per_piece=Decimal("-1.00"), description="x")
        with self.assertRaises(ValidationError) as ctx:
            product.full_clean()
        self.assertIn("price_per_piece", ctx.exception.message_dict)

    def test_negative_price_blocked_by_database_constraint(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            make_product(self.category, name="Bad", price_per_piece=Decimal("-5.00"))

    def test_required_fields(self):
        with self.assertRaises(ValidationError) as ctx:
            Product(name="", price_per_piece=None, description="").full_clean()
        for field in ("name", "category", "price_per_piece", "description"):
            self.assertIn(field, ctx.exception.message_dict)

    def test_image_upload_goes_to_products_folder(self):
        product = make_product(self.category, image=make_image_file("Bulb.webp", fmt="WEBP", content_type="image/webp"))
        self.assertTrue(product.image.name.startswith("products/led-headlight-bulbs-"))
        self.assertTrue(product.image.storage.exists(product.image.name))

    def test_minimum_quantity_defaults_to_one(self):
        product = make_product(self.category)
        self.assertFalse(product.has_minimum_order)
        self.assertEqual(product.minimum_quantity, 1)

    def test_minimum_quantity_when_enabled(self):
        product = make_product(self.category, has_minimum_order=True, min_order_quantity=50)
        self.assertEqual(product.minimum_quantity, 50)

    def test_minimum_order_requires_quantity(self):
        product = Product(
            name="Bulk", category=self.category, price_per_piece=Decimal("1"), description="x", has_minimum_order=True
        )
        with self.assertRaises(ValidationError) as ctx:
            product.full_clean()
        self.assertIn("min_order_quantity", ctx.exception.message_dict)

    def test_minimum_quantity_cleared_when_unticked(self):
        product = make_product(self.category, has_minimum_order=False, min_order_quantity=30)
        product.refresh_from_db()
        self.assertIsNone(product.min_order_quantity)
        self.assertEqual(product.minimum_quantity, 1)

    def test_database_rejects_minimum_order_without_quantity(self):
        product = make_product(self.category)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Product.objects.filter(pk=product.pk).update(has_minimum_order=True, min_order_quantity=None)

    def test_features_and_specifications_parsing(self):
        product = make_product(
            self.category,
            features="Bright output\n\n- Cooling fan\n",
            specifications="Voltage: 12V\nnot a spec line\nFitment:  H4, H7 ",
        )
        self.assertEqual(product.feature_list, ["Bright output", "Cooling fan"])
        self.assertEqual(
            product.specification_list,
            [{"label": "Voltage", "value": "12V"}, {"label": "Fitment", "value": "H4, H7"}],
        )


class ProductApiTests(TempMediaMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.lighting = Category.objects.create(name="Car Lighting")
        cls.wheels = Category.objects.create(name="Wheels & Tyres")
        cls.led = make_product(cls.lighting, name="Premium LED Headlight", is_featured=True)
        cls.fog = make_product(cls.lighting, name="Fog Lamp", description="Wide beam lamp.")
        cls.inflator = make_product(cls.wheels, name="Tyre Inflator", description="12V inflator with LED light.")

    def get(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    def test_list_is_paginated(self):
        data = self.get("/api/v1/products/")
        self.assertEqual(set(data), {"count", "next", "previous", "results"})
        self.assertEqual(data["count"], 3)

    def test_page_size_and_page(self):
        data = self.get("/api/v1/products/?page_size=2")
        self.assertEqual(len(data["results"]), 2)
        self.assertIsNotNone(data["next"])
        self.assertEqual(len(self.get("/api/v1/products/?page_size=2&page=2")["results"]), 1)

    def test_invalid_page_returns_404(self):
        self.assertEqual(self.client.get("/api/v1/products/?page=99").status_code, 404)

    def test_product_json_format(self):
        data = self.get(f"/api/v1/products/{self.led.slug}/")
        self.assertEqual(
            data,
            {
                "id": self.led.id,
                "name": "Premium LED Headlight",
                "slug": "premium-led-headlight",
                "category": {"id": self.lighting.id, "name": "Car Lighting", "slug": "car-lighting"},
                "price_per_piece": "850.00",
                "has_minimum_order": False,
                "min_order_quantity": 1,
                "stock": 0,
                "in_stock": False,
                "description": "Bright white LED bulbs.",
                "features": [],
                "specifications": [],
                "image": None,
                "is_featured": True,
            },
        )

    def test_price_is_exact_decimal_string(self):
        make_product(self.wheels, name="Valve Caps", price_per_piece=Decimal("19.90"))
        data = self.get("/api/v1/products/valve-caps/")
        self.assertEqual(data["price_per_piece"], "19.90")

    def test_minimum_order_in_api(self):
        make_product(self.wheels, name="Wheel Covers", has_minimum_order=True, min_order_quantity=50)
        data = self.get("/api/v1/products/wheel-covers/")
        self.assertTrue(data["has_minimum_order"])
        self.assertEqual(data["min_order_quantity"], 50)

    def test_filter_by_slugs(self):
        data = self.get("/api/v1/products/?slugs=fog-lamp,tyre-inflator,unknown")
        self.assertEqual({p["slug"] for p in data["results"]}, {"fog-lamp", "tyre-inflator"})

    def test_image_url_absolute_when_present(self):
        self.fog.image = make_image_file("fog.png")
        self.fog.save()
        data = self.get(f"/api/v1/products/{self.fog.slug}/")
        self.assertTrue(data["image"].startswith("http://testserver/media/products/fog-lamp-"))

    def test_filter_by_category_slug(self):
        data = self.get("/api/v1/products/?category=wheels-tyres")
        self.assertEqual([p["slug"] for p in data["results"]], ["tyre-inflator"])

    def test_unknown_category_returns_empty_list(self):
        self.assertEqual(self.get("/api/v1/products/?category=nope")["count"], 0)

    def test_search(self):
        data = self.get("/api/v1/products/?search=led")
        # name match + description match ("LED light"); fog lamp mentions neither
        self.assertEqual({p["slug"] for p in data["results"]}, {"premium-led-headlight", "tyre-inflator"})
        data = self.get("/api/v1/products/?search=beam")
        self.assertEqual([p["slug"] for p in data["results"]], ["fog-lamp"])

    def test_search_and_category_combined(self):
        data = self.get("/api/v1/products/?category=car-lighting&search=led")
        self.assertEqual([p["slug"] for p in data["results"]], ["premium-led-headlight"])
        data = self.get("/api/v1/products/?category=wheels-tyres&search=headlight")
        self.assertEqual(data["count"], 0)

    def test_featured_filter(self):
        data = self.get("/api/v1/products/?featured=true")
        self.assertEqual([p["slug"] for p in data["results"]], ["premium-led-headlight"])

    def test_unknown_product_returns_404(self):
        response = self.client.get("/api/v1/products/unknown-product/")
        self.assertEqual(response.status_code, 404)
        self.assertIn("detail", response.json())

    def test_api_is_read_only(self):
        payload = {"name": "X", "category": self.lighting.id, "price_per_piece": "1", "description": "x"}
        self.assertEqual(self.client.post("/api/v1/products/", payload, format="json").status_code, 405)
        self.assertEqual(self.client.patch(f"/api/v1/products/{self.led.slug}/", {"name": "Y"}).status_code, 405)
        self.assertEqual(self.client.delete(f"/api/v1/products/{self.led.slug}/").status_code, 405)
        self.assertEqual(Product.objects.count(), 3)


class SeedCommandTests(TestCase):
    def test_seed_is_idempotent_and_does_not_overwrite(self):
        call_command("seed_catalog", stdout=StringIO())
        self.assertEqual(Category.objects.count(), 6)
        self.assertEqual(Product.objects.count(), 18)
        self.assertEqual(Product.objects.filter(is_featured=True).count(), 6)

        product = Product.objects.get(slug="led-headlight-bulbs")
        product.price_per_piece = Decimal("99.00")
        product.save()

        call_command("seed_catalog", stdout=StringIO())
        self.assertEqual(Product.objects.count(), 18)
        self.assertEqual(Product.objects.get(slug="led-headlight-bulbs").price_per_piece, Decimal("99.00"))


class OrderLineSerializerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Car Care")
        cls.bulk = make_product(category, name="Bulk Shampoo", has_minimum_order=True, min_order_quantity=50)
        cls.single = make_product(category, name="Single Cloth")

    def test_rejects_quantity_below_product_minimum(self):
        serializer = OrderLineSerializer(data={"product": "bulk-shampoo", "quantity": 49})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Minimum order quantity for Bulk Shampoo is 50", str(serializer.errors["quantity"][0]))

    def test_accepts_product_minimum_and_above(self):
        for quantity in (50, 60):
            self.assertTrue(OrderLineSerializer(data={"product": "bulk-shampoo", "quantity": quantity}).is_valid())

    def test_products_without_minimum_start_at_one(self):
        self.assertTrue(OrderLineSerializer(data={"product": "single-cloth", "quantity": 1}).is_valid())
        self.assertFalse(OrderLineSerializer(data={"product": "single-cloth", "quantity": 0}).is_valid())

    def test_unknown_product_rejected(self):
        self.assertFalse(OrderLineSerializer(data={"product": "nope", "quantity": 5}).is_valid())
