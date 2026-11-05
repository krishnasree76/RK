from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F

from apps.core.models import TimeStampedModel
from apps.products.models import Product


class Order(TimeStampedModel):
    """An order placed from the website (sent to the business on WhatsApp)."""

    class Status(models.TextChoices):
        NEW = "new", "New"
        CONFIRMED = "confirmed", "Confirmed"
        DISPATCHED = "dispatched", "Dispatched"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    number = models.CharField(max_length=20, unique=True, null=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="customer account",
    )
    customer_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW, db_index=True)
    total_quantity = models.PositiveIntegerField(default=0)
    total_amount = models.DecimalField("order total (₹)", max_digits=12, decimal_places=2, default=Decimal("0.00"))
    notes = models.TextField("customer note", blank=True)
    lr_number = models.CharField(
        "LR number", max_length=50, blank=True, help_text="Lorry receipt number, shared with the customer after dispatch."
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.number or f"Order #{self.pk}"

    @classmethod
    def from_db(cls, db, field_names, values):
        instance = super().from_db(db, field_names, values)
        instance._loaded_status = instance.status
        return instance

    def clean(self):
        super().clean()
        previous = getattr(self, "_loaded_status", None)
        if previous == self.Status.CANCELLED and self.status != self.Status.CANCELLED:
            raise ValidationError({"status": "A cancelled order can't be reopened — its stock has been released."})

    def save(self, *args, **kwargs):
        previous = getattr(self, "_loaded_status", None)
        with transaction.atomic():
            super().save(*args, **kwargs)
            if not self.number:
                self.number = f"RK-{1000 + self.pk}"
                super().save(update_fields=["number"])
            if previous and previous != self.Status.CANCELLED and self.status == self.Status.CANCELLED:
                self._release_stock()
        self._loaded_status = self.status

    def _release_stock(self):
        for item in self.items.exclude(product=None):
            Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    # Snapshot fields keep the order readable even if the product is later edited or deleted.
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    product_name = models.CharField(max_length=200)
    product_slug = models.CharField(max_length=220)
    unit_price = models.DecimalField("price per piece (₹)", max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField("total (₹)", max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"
