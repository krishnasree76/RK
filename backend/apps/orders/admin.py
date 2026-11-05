from django.contrib import admin, messages
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import action, display

from .models import Order, OrderItem

STATUS_COLORS = {
    "New": "warning",
    "Confirmed": "info",
    "Dispatched": "primary",
    "Delivered": "success",
    "Cancelled": "danger",
}


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = ["product_name", "product", "unit_price", "quantity", "line_total"]
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ["number", "customer_name", "phone_links", "item_count", "total", "status_badge", "created_at"]
    list_display_links = ["number", "customer_name"]
    list_filter = ["status", ("created_at", RangeDateFilter)]
    list_filter_submit = True
    search_fields = ["number", "customer_name", "phone", "email", "items__product_name"]
    list_per_page = 25
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
    readonly_fields = [
        "number",
        "user",
        "customer_name",
        "phone_links",
        "email",
        "total_quantity",
        "total",
        "notes",
        "created_at",
        "updated_at",
    ]
    fieldsets = [
        ("Order", {"fields": ["number", "status", "lr_number"]}),
        ("Customer", {"fields": ["customer_name", "phone_links", "email", "user"]}),
        ("Totals", {"fields": ["total_quantity", "total"]}),
        ("Customer note", {"fields": ["notes"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]
    actions = ["mark_confirmed", "mark_dispatched", "mark_delivered", "mark_cancelled"]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("items")

    def has_add_permission(self, request):
        return False  # Orders are created from the website.

    @display(description="Phone")
    def phone_links(self, obj):
        digits = obj.phone.lstrip("+")
        return format_html(
            '{} · <a href="tel:{}" class="text-primary-600">Call</a> · '
            '<a href="https://wa.me/{}" target="_blank" rel="noopener" class="text-primary-600">WhatsApp</a>',
            obj.phone,
            obj.phone,
            digits,
        )

    @display(description="Items")
    def item_count(self, obj):
        return f"{len(obj.items.all())} · {obj.total_quantity} pcs"

    @display(description="Total", ordering="total_amount")
    def total(self, obj):
        return f"₹{obj.total_amount:,.2f}"

    @display(description="Status", ordering="status", label=STATUS_COLORS)
    def status_badge(self, obj):
        return obj.get_status_display()

    def _set_status(self, request, queryset, status):
        updated, skipped = 0, 0
        for order in queryset:
            if order.status == Order.Status.CANCELLED and status != Order.Status.CANCELLED:
                skipped += 1
                continue
            order.status = status
            order.save()
            updated += 1
        if updated:
            self.message_user(request, f"{updated} order(s) marked {Order.Status(status).label.lower()}.")
        if skipped:
            self.message_user(request, f"{skipped} cancelled order(s) left unchanged.", level=messages.WARNING)

    @action(description="Mark as confirmed")
    def mark_confirmed(self, request, queryset):
        self._set_status(request, queryset, Order.Status.CONFIRMED)

    @action(description="Mark as dispatched")
    def mark_dispatched(self, request, queryset):
        self._set_status(request, queryset, Order.Status.DISPATCHED)

    @action(description="Mark as delivered")
    def mark_delivered(self, request, queryset):
        self._set_status(request, queryset, Order.Status.DELIVERED)

    @action(description="Cancel (returns stock)")
    def mark_cancelled(self, request, queryset):
        self._set_status(request, queryset, Order.Status.CANCELLED)
