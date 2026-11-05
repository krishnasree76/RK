from django.conf import settings


def environment_callback(request):
    """Badge shown in the Unfold header so staff know which environment they're in."""
    if settings.DEBUG:
        return ["Development", "warning"]
    return ["Production", "success"]


def new_orders_badge(request):
    """Number of orders waiting to be confirmed, shown next to "Orders" in the sidebar."""
    from apps.orders.models import Order

    count = Order.objects.filter(status=Order.Status.NEW).count()
    return str(count) if count else None
