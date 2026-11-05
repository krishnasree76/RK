import os
import uuid

from django.utils.text import slugify


def unique_slug(instance, value, *, field_name="slug", fallback="item"):
    """
    Return a slug for `value` that is unique for the instance's model,
    appending -2, -3 ... on collision. The instance itself is excluded so
    re-saving keeps its own slug.
    """
    max_length = instance._meta.get_field(field_name).max_length
    base = slugify(value)[:max_length].strip("-") or fallback
    queryset = type(instance)._default_manager.all()
    if instance.pk:
        queryset = queryset.exclude(pk=instance.pk)

    candidate, counter = base, 2
    while queryset.filter(**{field_name: candidate}).exists():
        suffix = f"-{counter}"
        candidate = f"{base[: max_length - len(suffix)].rstrip('-')}{suffix}"
        counter += 1
    return candidate


def image_upload_path(folder):
    """Build an upload_to callable: <folder>/<slug>-<random>.<ext>."""

    def _upload_to(instance, filename):
        ext = os.path.splitext(filename)[1].lower() or ".jpg"
        stem = slugify(getattr(instance, "slug", "") or getattr(instance, "name", "")) or folder
        return f"{folder}/{stem[:60]}-{uuid.uuid4().hex[:8]}{ext}"

    _upload_to.__name__ = f"upload_to_{folder}"
    return _upload_to


def category_image_path(instance, filename):
    return image_upload_path("categories")(instance, filename)


def product_image_path(instance, filename):
    return image_upload_path("products")(instance, filename)
