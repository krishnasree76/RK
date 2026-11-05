from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.core.validators import normalize_phone

from .models import CustomerProfile, display_name

User = get_user_model()

LOGIN_ERROR = "Incorrect email/phone or password."


def get_profile(user):
    profile, _ = CustomerProfile.objects.get_or_create(user=user)
    return profile


def clean_phone(value, *, exclude_user=None):
    try:
        phone = normalize_phone(value)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(exc.messages[0]) from exc
    taken = CustomerProfile.objects.filter(phone=phone)
    if exclude_user is not None:
        taken = taken.exclude(user=exclude_user)
    if taken.exists():
        raise serializers.ValidationError("An account with this phone number already exists.")
    return phone


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    auth_provider = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "email", "phone", "auth_provider"]

    def get_name(self, user):
        return display_name(user)

    def get_phone(self, user):
        return get_profile(user).phone

    def get_auth_provider(self, user):
        return "google" if get_profile(user).google_sub else "password"


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, trim_whitespace=False, style={"input_type": "password"})

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists. Please sign in.")
        return email

    def validate_phone(self, value):
        return clean_phone(value)

    def validate(self, attrs):
        candidate = User(username=attrs["email"], email=attrs["email"], first_name=attrs["name"])
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["name"],
        )
        CustomerProfile.objects.create(user=user, phone=validated_data["phone"])
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254, help_text="Email address or phone number")
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        user = None
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).order_by("id").first()
        else:
            try:
                phone = normalize_phone(identifier)
                profile = CustomerProfile.objects.select_related("user").filter(phone=phone).first()
                user = profile.user if profile else None
            except DjangoValidationError:
                user = User.objects.filter(username=identifier).first()

        if not user or not user.is_active or not user.check_password(attrs["password"]):
            raise serializers.ValidationError(LOGIN_ERROR, code="authorization")
        attrs["user"] = user
        return attrs


class GoogleLoginSerializer(serializers.Serializer):
    credential = serializers.CharField(max_length=4096)


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False, trim_whitespace=True)
    phone = serializers.CharField(max_length=20, required=False)

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Please enter your name.")
        return value

    def validate_phone(self, value):
        return clean_phone(value, exclude_user=self.context["request"].user)

    def save(self):
        user = self.context["request"].user
        if "name" in self.validated_data:
            user.first_name, user.last_name = self.validated_data["name"], ""
            user.save(update_fields=["first_name", "last_name"])
        if "phone" in self.validated_data:
            profile = get_profile(user)
            profile.phone = self.validated_data["phone"]
            profile.save(update_fields=["phone", "updated_at"])
        return user
