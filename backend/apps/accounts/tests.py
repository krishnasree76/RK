from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.core.validators import normalize_phone

from .google import GoogleAuthError
from .models import CustomerProfile

User = get_user_model()
PASSWORD = "Wholesale-2026!"


class PhoneNormalisationTests(SimpleTestCase):
    def test_accepts_common_formats(self):
        for raw in ("9515289991", "+91 95152 89991", "91-9515289991", "09515289991"):
            self.assertEqual(normalize_phone(raw), "+919515289991")

    def test_rejects_invalid_numbers(self):
        for raw in ("12345", "5515289991", "abcdefghij", ""):
            with self.assertRaises(ValidationError):
                normalize_phone(raw)


class AuthApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset rate-limit counters between tests

    def register(self, **overrides):
        payload = {"name": "Ravi Kumar", "email": "Ravi@Example.com", "phone": "98765 43210", "password": PASSWORD}
        payload.update(overrides)
        return self.client.post("/api/v1/auth/register/", payload, format="json")

    def test_register_creates_user_profile_and_token(self):
        response = self.register()
        self.assertEqual(response.status_code, 201, response.content)
        data = response.json()
        self.assertTrue(data["token"])
        self.assertEqual(
            data["user"],
            {"id": data["user"]["id"], "name": "Ravi Kumar", "email": "ravi@example.com", "phone": "+919876543210", "auth_provider": "password"},
        )
        user = User.objects.get(email="ravi@example.com")
        self.assertEqual(user.profile.phone, "+919876543210")
        self.assertTrue(user.check_password(PASSWORD))

    def test_register_rejects_duplicates_and_weak_password(self):
        self.register()
        self.assertIn("email", self.register(phone="9876500000").json())
        self.assertIn("phone", self.register(email="other@example.com").json())
        self.assertIn("password", self.register(email="x@example.com", phone="9876511111", password="123").json())
        self.assertIn("phone", self.register(email="y@example.com", phone="12345").json())

    def test_login_with_email_or_phone(self):
        self.register()
        for identifier in ("ravi@example.com", "RAVI@example.com", "9876543210", "+91 98765 43210"):
            response = self.client.post("/api/v1/auth/login/", {"identifier": identifier, "password": PASSWORD}, format="json")
            self.assertEqual(response.status_code, 200, identifier)
            self.assertEqual(response.json()["user"]["email"], "ravi@example.com")

    def test_login_wrong_password_is_generic(self):
        self.register()
        response = self.client.post("/api/v1/auth/login/", {"identifier": "ravi@example.com", "password": "nope"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Incorrect email/phone or password", str(response.json()))

    def test_login_is_rate_limited(self):
        statuses = [
            self.client.post("/api/v1/auth/login/", {"identifier": "a@b.com", "password": "x"}, format="json").status_code
            for _ in range(12)
        ]
        self.assertIn(429, statuses)

    def test_me_requires_token_and_updates_profile(self):
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)
        token = self.register().json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/v1/auth/me/").json()["name"], "Ravi Kumar")
        response = self.client.patch("/api/v1/auth/me/", {"name": "Ravi K", "phone": "9000000001"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["phone"], "+919000000001")
        self.assertEqual(response.json()["name"], "Ravi K")

    def test_logout_deletes_token(self):
        token = self.register().json()["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.post("/api/v1/auth/logout/").status_code, 204)
        self.assertFalse(Token.objects.filter(key=token).exists())
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)


@override_settings(GOOGLE_CLIENT_ID="test-client.apps.googleusercontent.com")
class GoogleLoginTests(APITestCase):
    CLAIMS = {"sub": "1234567890", "email": "Priya@Gmail.com", "email_verified": True, "name": "Priya Shah",
              "iss": "accounts.google.com"}

    def setUp(self):
        cache.clear()

    def google(self, claims=None):
        with mock.patch("apps.accounts.views.verify_google_credential", return_value=claims or self.CLAIMS):
            return self.client.post("/api/v1/auth/google/", {"credential": "fake-id-token"}, format="json")

    def test_creates_account_on_first_sign_in(self):
        response = self.google()
        self.assertEqual(response.status_code, 201, response.content)
        user = response.json()["user"]
        self.assertEqual((user["email"], user["name"], user["auth_provider"], user["phone"]),
                         ("priya@gmail.com", "Priya Shah", "google", None))
        self.assertFalse(User.objects.get(email="priya@gmail.com").has_usable_password())

    def test_returning_user_gets_same_account(self):
        first = self.google().json()["user"]["id"]
        second = self.google()
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.json()["user"]["id"], first)
        self.assertEqual(User.objects.count(), 1)

    def test_links_existing_account_with_same_email(self):
        user = User.objects.create_user("priya@gmail.com", "priya@gmail.com", PASSWORD)
        response = self.google()
        self.assertEqual(response.json()["user"]["id"], user.id)
        self.assertEqual(CustomerProfile.objects.get(user=user).google_sub, "1234567890")

    def test_invalid_token_rejected(self):
        with mock.patch("apps.accounts.views.verify_google_credential", side_effect=GoogleAuthError("bad")):
            response = self.client.post("/api/v1/auth/google/", {"credential": "x"}, format="json")
        self.assertEqual(response.status_code, 400)

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_not_configured_returns_503(self):
        response = self.client.post("/api/v1/auth/google/", {"credential": "x"}, format="json")
        self.assertEqual(response.status_code, 503)
