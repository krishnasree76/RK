from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .google import GoogleAuthError, GoogleNotConfigured, verify_google_credential
from .models import CustomerProfile
from .serializers import (
    GoogleLoginSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
    get_profile,
)

User = get_user_model()


def auth_response(user, *, status_code=status.HTTP_200_OK):
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data}, status=status_code)


class AuthThrottleMixin:
    """Sign-in / sign-up endpoints are rate limited per IP to slow down guessing."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(AuthThrottleMixin, APIView):
    """POST /api/v1/auth/register/  {name, email, phone, password}"""

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return auth_response(user, status_code=status.HTTP_201_CREATED)


class LoginView(AuthThrottleMixin, APIView):
    """POST /api/v1/auth/login/  {identifier: email or phone, password}"""

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return auth_response(serializer.validated_data["user"])


class GoogleLoginView(AuthThrottleMixin, APIView):
    """POST /api/v1/auth/google/  {credential: <Google ID token>}"""

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            claims = verify_google_credential(serializer.validated_data["credential"])
        except GoogleNotConfigured as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except GoogleAuthError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user, created = self._get_or_create_user(claims)
        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=status.HTTP_403_FORBIDDEN)
        return auth_response(user, status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @transaction.atomic
    def _get_or_create_user(self, claims):
        sub, email = claims["sub"], claims["email"].lower()

        profile = CustomerProfile.objects.select_related("user").filter(google_sub=sub).first()
        if profile:
            return profile.user, False

        # Link to an existing account with the same (Google-verified) email.
        user = User.objects.filter(email__iexact=email).order_by("id").first()
        created = user is None
        if created:
            username = email
            if User.objects.filter(username__iexact=username).exists():
                username = f"google-{sub}"
            user = User(username=username, email=email, first_name=claims.get("name", "")[:150])
            user.set_unusable_password()
            user.save()

        profile = get_profile(user)
        profile.google_sub = sub
        profile.save(update_fields=["google_sub", "updated_at"])
        return user, created


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — invalidates the current token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET / PATCH /api/v1/auth/me/ — the signed-in customer's profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)
