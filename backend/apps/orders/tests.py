from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import CustomerProfile
from apps.categories.models import Category
from apps.products.models import Product

from .models import Order

User = get_user_model()


class OrderApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Car Care")
        cls.bulk = Product.objects.create(
            name="Bulk Shampoo", category=category, price_per_piece=Decimal("1249.50"), description="x",
            has_minimum_order=True, min_order_quantity=50, stock=200,
        )
        cls.single = Product.objects.create(
            name="Air Freshener", category=category, price_per_piece=Decimal("99.90"), description="x", stock=5,
        )
        cls.empty = Product.objects.create(
            name="Sold Out Wax", category=category, price_per_piece=Decimal("10.00"), description="x", stock=0,
        )
        cls.user = User.objects.create_user("ravi@example.com", "ravi@example.com", "Wholesale-2026!", first_name="Ravi Kumar")
        CustomerProfile.objects.create(user=cls.user)
        cls.other = User.objects.create_user("other@example.com", "other@example.com", "Wholesale-2026!")

    def setUp(self):
        cache.clear()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=self.user)[0].key}")

    def place(self, items, phone="98765 43210", **extra):
        return self.client.post("/api/v1/orders/", {"items": items, "phone": phone, **extra}, format="json")

    def test_requires_sign_in(self):
        self.client.credentials()
        response = self.place([{"product": "air-freshener", "quantity": 1}])
        self.assertEqual(response.status_code, 401)
        self.assertEqual(Order.objects.count(), 0)

    def test_places_order_with_server_prices_and_reduces_stock(self):
        response = self.place(
            [{"product": "bulk-shampoo", "quantity": 60, "unit_price": "1.00"}, {"product": "air-freshener", "quantity": 3}],
            notes="Deliver to Karol Bagh",
        )
        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        self.assertRegex(data["number"], r"^RK-\d{4,}$")
        self.assertEqual(data["status"], "new")
        self.assertEqual(data["total_quantity"], 63)
        self.assertEqual(data["total_amount"], "75269.70")  # 60 × 1249.50 + 3 × 99.90
        self.assertEqual(data["phone"], "+919876543210")
        self.assertEqual(data["customer_name"], "Ravi Kumar")
        self.assertEqual([i["line_total"] for i in data["items"]], ["74970.00", "299.70"])

        self.bulk.refresh_from_db()
        self.single.refresh_from_db()
        self.assertEqual((self.bulk.stock, self.single.stock), (140, 2))
        # Phone saved to the profile for next time.
        self.assertEqual(CustomerProfile.objects.get(user=self.user).phone, "+919876543210")

    def test_enforces_minimum_quantity(self):
        response = self.place([{"product": "bulk-shampoo", "quantity": 49}])
        self.assertEqual(response.status_code, 400)
        self.assertIn("Minimum order quantity for Bulk Shampoo is 50", str(response.json()))
        self.assertEqual(Order.objects.count(), 0)

    def test_enforces_stock_and_rolls_back(self):
        response = self.place([{"product": "bulk-shampoo", "quantity": 50}, {"product": "air-freshener", "quantity": 6}])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["items"]["air-freshener"], "Only 5 pcs of Air Freshener in stock.")
        self.bulk.refresh_from_db()
        self.assertEqual(self.bulk.stock, 200)  # nothing reserved
        self.assertEqual(Order.objects.count(), 0)

        response = self.place([{"product": "sold-out-wax", "quantity": 1}])
        self.assertEqual(response.json()["items"]["sold-out-wax"], "Sold Out Wax is out of stock.")

    def test_duplicate_lines_are_merged(self):
        response = self.place([{"product": "air-freshener", "quantity": 2}, {"product": "air-freshener", "quantity": 2}])
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()["items"]), 1)
        self.assertEqual(response.json()["items"][0]["quantity"], 4)

    def test_validation_errors(self):
        self.assertEqual(self.place([]).status_code, 400)
        self.assertIn("phone", self.place([{"product": "air-freshener", "quantity": 1}], phone="123").json())
        self.assertIn("items", self.place([{"product": "missing", "quantity": 1}]).json())

    def test_customers_only_see_their_own_orders(self):
        number = self.place([{"product": "air-freshener", "quantity": 1}]).json()["number"]
        self.assertEqual([o["number"] for o in self.client.get("/api/v1/orders/").json()["results"]], [number])
        self.assertEqual(self.client.get(f"/api/v1/orders/{number}/").status_code, 200)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=self.other)[0].key}")
        self.assertEqual(self.client.get("/api/v1/orders/").json()["count"], 0)
        self.assertEqual(self.client.get(f"/api/v1/orders/{number}/").status_code, 404)

    def test_orders_cannot_be_edited_through_api(self):
        number = self.place([{"product": "air-freshener", "quantity": 1}]).json()["number"]
        self.assertEqual(self.client.patch(f"/api/v1/orders/{number}/", {"status": "delivered"}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(f"/api/v1/orders/{number}/").status_code, 405)

    def test_cancelling_returns_stock_once_and_cannot_reopen(self):
        number = self.place([{"product": "air-freshener", "quantity": 4}]).json()["number"]
        order = Order.objects.get(number=number)
        order.status = Order.Status.CONFIRMED
        order.save()
        self.single.refresh_from_db()
        self.assertEqual(self.single.stock, 1)

        order.status = Order.Status.CANCELLED
        order.save()
        order.save()  # saving again must not add the stock twice
        self.single.refresh_from_db()
        self.assertEqual(self.single.stock, 5)

        order = Order.objects.get(pk=order.pk)
        order.status = Order.Status.NEW
        with self.assertRaises(ValidationError):
            order.full_clean()

    def test_cors_allows_post_from_frontend(self):
        response = self.client.options(
            "/api/v1/orders/",
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,content-type",
        )
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")
        self.assertIn("POST", response.headers.get("Access-Control-Allow-Methods", ""))


class OrderAdminTests(APITestCase):
    def test_order_pages_and_cancel_action(self):
        from django.urls import reverse

        from .services import place_order

        category = Category.objects.create(name="Lighting")
        product = Product.objects.create(name="LED Bulb", category=category, price_per_piece=Decimal("50"), description="x", stock=10)
        customer = User.objects.create_user("c@example.com", "c@example.com", "Wholesale-2026!", first_name="Asha")
        order = place_order(user=customer, lines=[{"product": product, "quantity": 4}], phone="+919876543210")

        admin = User.objects.create_superuser("owner", "owner@example.com", "Wholesale-2026!")
        self.client.force_login(admin)
        changelist = reverse("admin:orders_order_changelist")
        for url in (changelist, changelist + "?status=new", reverse("admin:orders_order_change", args=[order.pk])):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, url)
            self.assertContains(response, order.number)
        self.assertContains(self.client.get(reverse("admin:index")), "Orders")

        response = self.client.post(changelist, {"action": "mark_cancelled", "_selected_action": [order.pk]}, follow=True)
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        product.refresh_from_db()
        self.assertEqual((order.status, product.stock), ("cancelled", 10))
