from django.db import models
from django.utils.text import slugify

from apps.core.models import TimeStampedModel
from apps.core.utils import category_image_path, unique_slug
from apps.core.validators import IMAGE_VALIDATORS


class Category(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(
        max_length=140,
        unique=True,
        blank=True,
        help_text="Used in website URLs, e.g. /products?category=wheels-tyres. Leave blank to generate from the name.",
    )
    description = models.TextField(blank=True, help_text="Short line shown on the website category card.")
    image = models.ImageField(
        upload_to=category_image_path,
        blank=True,
        validators=IMAGE_VALIDATORS,
        help_text="JPG, PNG or WebP, up to 5 MB. Landscape images around 1600px wide work best.",
    )
    sort_order = models.PositiveSmallIntegerField(
        "display order",
        default=0,
        help_text="Lower numbers appear first on the website. Categories with the same number are sorted by name.",
    )

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "category"
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate from the name when blank; normalise and de-duplicate when
        # edited manually so a collision never raises at the database level.
        source = slugify(self.slug) if self.slug else self.name
        self.slug = unique_slug(self, source, fallback="category")
        super().save(*args, **kwargs)
