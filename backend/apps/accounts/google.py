"""Verification of Google Sign-In ID tokens (the credential from the Google button)."""

from django.conf import settings

GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


class GoogleAuthError(Exception):
    pass


class GoogleNotConfigured(GoogleAuthError):
    pass


def verify_google_credential(credential):
    """
    Verify the ID token's signature, expiry, issuer and audience (our client ID)
    and return its claims. Only GOOGLE_CLIENT_ID is needed for this flow.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleNotConfigured("Google sign-in is not configured yet.")

    # Imported lazily so the rest of the site works even if google-auth is missing.
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        claims = id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except ValueError as exc:
        raise GoogleAuthError("Google sign-in could not be verified. Please try again.") from exc

    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise GoogleAuthError("Google sign-in could not be verified. Please try again.")
    if not claims.get("email") or not claims.get("email_verified"):
        raise GoogleAuthError("Your Google account email is not verified.")
    return claims
