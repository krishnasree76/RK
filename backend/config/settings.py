"""
Django settings for the RK ENTERPRICES DELHI backend.

All environment-specific values (secrets, hosts, origins, DEBUG) come from
environment variables, optionally loaded from backend/.env. See .env.example.
"""

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key
from django.templatetags.static import static
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


# --- Core -------------------------------------------------------------------

DEBUG = env_bool("DJANGO_DEBUG", False)

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is off.")
    # Development only: an ephemeral key (sessions reset on restart).
    SECRET_KEY = get_random_secret_key()

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1" if DEBUG else "")

# Public URL of the React site, used for the admin "View site" link.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Admin path can be moved away from the default /admin/ in production.
ADMIN_URL = os.environ.get("DJANGO_ADMIN_URL", "admin/").strip("/") + "/"

INSTALLED_APPS = [
    # Unfold must come before django.contrib.admin
    "unfold",
    "unfold.contrib.filters",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # Local
    "apps.core",
    "apps.categories",
    "apps.products",
    "apps.accounts",
    "apps.orders",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Database ---------------------------------------------------------------
# SQLite for development. The file is git-ignored.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("DJANGO_SQLITE_PATH", str(BASE_DIR / "db.sqlite3")),
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# --- Static & media -----------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.environ.get("DJANGO_MEDIA_ROOT", BASE_DIR / "media"))

# Upload rules for category / product images.
MAX_IMAGE_UPLOAD_MB = int(os.environ.get("MAX_IMAGE_UPLOAD_MB", "5"))
ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# --- REST framework -----------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    # Customers sign in with a token (Authorization: Token <key>) issued by /api/v1/auth/.
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.TokenAuthentication"],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("API_ANON_RATE", "600/minute"),
        "user": os.environ.get("API_USER_RATE", "1200/minute"),
        # Sign-in / sign-up attempts per IP (slows down password guessing).
        "auth": os.environ.get("API_AUTH_RATE", "10/minute"),
    },
}

# --- CORS / CSRF ----------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173" if DEBUG else ""
)
CORS_URLS_REGEX = r"^/api/.*$"
CORS_ALLOW_METHODS = ["GET", "HEAD", "OPTIONS", "POST", "PATCH"]
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")

# --- Google Sign-In ---------------------------------------------------------------
# OAuth client ID from Google Cloud Console (APIs & Services → Credentials).
# The same ID goes in the frontend as VITE_GOOGLE_CLIENT_ID. Leave empty to hide
# Google sign-in. The client secret is not used by this sign-in flow (the
# browser receives a signed ID token that the backend verifies with the ID).
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()

# --- Production security --------------------------------------------------------

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_HSTS_SECONDS", "0"))
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# --- Unfold admin ---------------------------------------------------------------
# Light theme: white/off-white surfaces with black text (the inverse of the
# website's dark sections). Neutral scale from the site palette (#F5F5F5,
# #C7C7C7, #242424, #151515, #050505) plus a red scale centred on #E10600.

UNFOLD = {
    "SITE_TITLE": "RK ENTERPRICES DELHI",
    "SITE_HEADER": "RK ENTERPRICES DELHI",
    "SITE_SUBHEADER": "Automotive Wholesale Management",
    "SITE_URL": FRONTEND_URL,
    "SITE_SYMBOL": "directions_car",
    "SITE_LOGO": lambda request: static("rk/logo.png"),
    "SITE_FAVICONS": [
        {"rel": "icon", "type": "image/svg+xml", "href": lambda request: static("rk/favicon.svg")},
    ],
    "THEME": "light",
    "BORDER_RADIUS": "4px",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "ENVIRONMENT": "config.admin_theme.environment_callback",
    "STYLES": [lambda request: static("rk/admin.css")],
    "SCRIPTS": [lambda request: static("rk/admin-theme.js")],
    "COLORS": {
        "base": {
            "50": "oklch(97% 0 0)",
            "100": "oklch(94.5% 0 0)",
            "200": "oklch(90% 0 0)",
            "300": "oklch(83% 0 0)",
            "400": "oklch(70% 0 0)",
            "500": "oklch(50% 0 0)",
            "600": "oklch(40% 0 0)",
            "700": "oklch(30% 0 0)",
            "800": "oklch(26% 0 0)",
            "900": "oklch(19.6% 0 0)",
            "950": "oklch(11.5% 0 0)",
        },
        "primary": {
            "50": "oklch(97% .015 25)",
            "100": "oklch(93.6% .032 22)",
            "200": "oklch(88.5% .062 22)",
            "300": "oklch(80.8% .114 23)",
            "400": "oklch(70.4% .19 25)",
            "500": "oklch(63.7% .237 27)",
            "600": "oklch(57.3% .233 29.5)",
            "700": "oklch(50.5% .213 29)",
            "800": "oklch(44.4% .177 28)",
            "900": "oklch(39.6% .141 27)",
            "950": "oklch(25.8% .092 27)",
        },
        # Text tones: darker than Unfold's defaults so everything reads clearly on white.
        "font": {
            "subtle-light": "var(--color-base-600)",
            "subtle-dark": "var(--color-base-400)",
            "default-light": "var(--color-base-800)",
            "default-dark": "var(--color-base-300)",
            "important-light": "var(--color-base-950)",
            "important-dark": "var(--color-base-100)",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": _("Sales"),
                "separator": True,
                "items": [
                    {
                        "title": _("Orders"),
                        "icon": "receipt_long",
                        "link": reverse_lazy("admin:orders_order_changelist"),
                        "badge": "config.admin_theme.new_orders_badge",
                    },
                ],
            },
            {
                "title": _("Catalogue"),
                "separator": True,
                "items": [
                    {
                        "title": _("Categories"),
                        "icon": "category",
                        "link": reverse_lazy("admin:categories_category_changelist"),
                    },
                    {
                        "title": _("Products"),
                        "icon": "inventory_2",
                        "link": reverse_lazy("admin:products_product_changelist"),
                    },
                ],
            },
            {
                "title": _("Customers & access"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Users & customers"),
                        "icon": "person",
                        "link": reverse_lazy("admin:auth_user_changelist"),
                    },
                    {
                        "title": _("Groups"),
                        "icon": "group",
                        "link": reverse_lazy("admin:auth_group_changelist"),
                    },
                ],
            },
        ],
    },
}
