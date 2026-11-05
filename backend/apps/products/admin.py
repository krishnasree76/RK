from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import BooleanRadioFilter, RangeDateFilter, RelatedDropdownFilter
from unfold.decorators import display

from apps.core.admin import image_thumbnail

from .models import Product


class StockFilter(admin.SimpleListFilter):
    title = "stock"
    parameter_name = "stock_status"

    def lookups(self, request, model_admin):
        return [("in", "In stock"), ("out", "Out of stock")]

    def queryset(self, request, queryset):
        if self.value() == "in":
            return queryset.filter(stock__gt=0)
        if self.value() == "out":
            return queryset.filter(stock=0)
        return queryset


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ["thumbnail", "name", "category", "price", "minimum_order", "stock", "is_featured", "updated_at"]
    list_display_links = ["thumbnail", "name"]
    list_editable = ["stock"]
    list_select_related = ["category"]
    search_fields = ["name", "description"]
    list_filter = [
        ("category", RelatedDropdownFilter),
        StockFilter,
        ("has_minimum_order", BooleanRadioFilter),
        ("is_featured", BooleanRadioFilter),
        ("created_at", RangeDateFilter),
        ("updated_at", RangeDateFilter),
    ]
    list_filter_submit = True
    list_per_page = 25
    autocomplete_fields = ["category"]
    prepopulated_fields = {"slug": ("name",)}
    # Unfold's file widget shows the current image as a preview above the upload field.
    readonly_fields = ["created_at", "updated_at"]
    save_on_top = True
    # Show "minimum quantity" only when the "minimum order" box is ticked.
    conditional_fields = {"min_order_quantity": "has_minimum_order == true"}
    fieldsets = [
        ("Product", {"fields": ["name", "slug", "category", "is_featured"]}),
        ("Pricing, stock & ordering", {"fields": ["price_per_piece", "stock", "has_minimum_order", "min_order_quantity"]}),
        ("Content", {"fields": ["description", "features", "specifications"]}),
        ("Image", {"fields": ["image"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @display(description="Image")
    def thumbnail(self, obj):
        return image_thumbnail(obj.image)

    @display(description="Min. order", ordering="min_order_quantity")
    def minimum_order(self, obj):
        return f"{obj.min_order_quantity} pcs" if obj.has_minimum_order else "From 1 pc"

    @display(description="Price / piece", ordering="price_per_piece")
    def price(self, obj):
        return f"₹{obj.price_per_piece:,.2f}"
