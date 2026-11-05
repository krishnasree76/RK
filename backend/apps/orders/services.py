from collections import OrderedDict
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from apps.accounts.models import display_name
from apps.products.models import Product

from .models import Order, OrderItem


@transaction.atomic
def place_order(*, user, lines, phone, notes=""):
    """
    Create an order from [{"product": Product, "quantity": int}, ...].

    Prices always come from the database (never the browser). Each product's
    minimum order and available stock are checked while the product rows are
    locked, then stock is reduced. Raises ValidationError with per-product
    messages keyed by slug.
    """
    # Merge duplicate products into one line.
    merged = OrderedDict()
    for line in lines:
        merged[line["product"].pk] = merged.get(line["product"].pk, 0) + line["quantity"]

    products = {p.pk: p for p in Product.objects.select_for_update().filter(pk__in=merged)}

    errors = {}
    for product_id, quantity in merged.items():
        product = products.get(product_id)
        if product is None:
            errors[str(product_id)] = "This product is no longer available."
        elif quantity < product.minimum_quantity:
            errors[product.slug] = f"Minimum order quantity for {product.name} is {product.minimum_quantity} pieces."
        elif quantity > product.stock:
            errors[product.slug] = (
                f"Only {product.stock} pcs of {product.name} in stock." if product.stock else f"{product.name} is out of stock."
            )
    if errors:
        raise ValidationError({"items": errors})

    order = Order.objects.create(
        user=user,
        customer_name=display_name(user)[:150],
        phone=phone,
        email=user.email or "",
        notes=notes,
    )

    total_quantity, total_amount = 0, Decimal("0.00")
    items = []
    for product_id, quantity in merged.items():
        product = products[product_id]
        line_total = product.price_per_piece * quantity
        items.append(
            OrderItem(
                order=order,
                product=product,
                product_name=product.name,
                product_slug=product.slug,
                unit_price=product.price_per_piece,
                quantity=quantity,
                line_total=line_total,
            )
        )
        Product.objects.filter(pk=product_id).update(stock=F("stock") - quantity)
        total_quantity += quantity
        total_amount += line_total

    OrderItem.objects.bulk_create(items)
    order.total_quantity, order.total_amount = total_quantity, total_amount
    order.save(update_fields=["total_quantity", "total_amount", "updated_at"])
    return order
