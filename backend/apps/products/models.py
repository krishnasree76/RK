from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

from apps.categories.models import Category
from apps.core.models import TimeStampedModel
from apps.core.utils import product_image_path, unique_slug
from apps.core.validators import IMAGE_VALIDATORS


class Product(TimeStampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(
        max_length=220,
        unique=True,
        blank=True,
        help_text="Used in the product URL, e.g. /products/led-headlight-bulbs. Leave blank to generate from the name.",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,  # a category with products cannot be deleted
        related_name="products",
    )
    price_per_piece = models.DecimalField(
        "price per piece (₹)",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Shown on the website and used to calculate order totals.",
    )
    has_minimum_order = models.BooleanField(
        "minimum order",
        default=False,
        help_text="Tick to require a minimum quantity for this product. Unticked: customers can order from 1 piece.",
    )
    min_order_quantity = models.PositiveIntegerField(
        "minimum quantity",
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Customers must order at least this many pieces.",
    )
    stock = models.PositiveIntegerField(
        "stock (pcs)",
        default=0,
        help_text="Pieces available to order. Reduced automatically when an order is placed and "
        "restored if the order is cancelled. 0 shows the product as out of stock.",
    )
    description = models.TextField()
    features = models.TextField(blank=True, help_text="Optional. One feature per line.")
    specifications = models.TextField(
        blank=True,
        help_text="Optional. One per line as “Label: Value”, e.g. “Material: ABS plastic”.",
    )
    image = models.ImageField(
        upload_to=product_image_path,
        blank=True,
        validators=IMAGE_VALIDATORS,
        help_text="JPG, PNG or WebP, up to 5 MB. A 4:3 image around 1200px wide works best.",
    )
    is_featured = models.BooleanField(
        "featured on homepage",
        default=False,
        help_text="Featured products appear in the homepage “Featured products” section.",
    )

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["is_featured", "name"])]
        constraints = [
            models.CheckConstraint(condition=Q(price_per_piece__gte=0), name="product_price_non_negative"),
            models.CheckConstraint(
                condition=Q(has_minimum_order=False) | Q(min_order_quantity__isnull=False, min_order_quantity__gte=1),
                name="product_min_quantity_when_required",
            ),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.has_minimum_order and not self.min_order_quantity:
            raise ValidationError({"min_order_quantity": "Enter the minimum quantity, or untick “Minimum order”."})

    def save(self, *args, **kwargs):
        if not self.has_minimum_order:
            self.min_order_quantity = None
        source = slugify(self.slug) if self.slug else self.name
        self.slug = unique_slug(self, source, fallback="product")
        super().save(*args, **kwargs)

    @property
    def minimum_quantity(self):
        """Smallest quantity a customer may order: the set minimum, otherwise 1."""
        return self.min_order_quantity if self.has_minimum_order and self.min_order_quantity else 1

    @property
    def can_be_ordered(self):
        """True when there is enough stock to meet the minimum quantity."""
        return self.stock >= self.minimum_quantity

    @property
    def feature_list(self):
        return [line.strip(" -•\t") for line in self.features.splitlines() if line.strip(" -•\t")]

    @property
    def specification_list(self):
        specs = []
        for line in self.specifications.splitlines():
            if ":" in line:
                label, value = line.split(":", 1)
                if label.strip() and value.strip():
                    specs.append({"label": label.strip(), "value": value.strip()})
        return specs
