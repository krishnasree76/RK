from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class CustomerProfile(TimeStampedModel):
    """Extra customer details kept alongside Django's built-in User."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(
        "phone number",
        max_length=15,
        unique=True,
        null=True,
        blank=True,
        help_text="Indian mobile number, stored as +91XXXXXXXXXX. Used for sign-in and orders.",
    )
    google_sub = models.CharField(
        "Google account ID",
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        editable=False,
        help_text="Set automatically when the customer signs in with Google.",
    )

    class Meta:
        verbose_name = "customer profile"

    def __str__(self):
        return f"{self.user} ({self.phone or 'no phone'})"


def display_name(user):
    return user.get_full_name().strip() or user.email or user.get_username()
