from django.contrib import admin
from django.db.models import Count
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display

from apps.core.admin import image_thumbnail

from .models import Category


class HasImageFilter(admin.SimpleListFilter):
    title = "image"
    parameter_name = "has_image"

    def lookups(self, request, model_admin):
        return [("yes", "With image"), ("no", "Without image")]

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.exclude(image="")
        if self.value() == "no":
            return queryset.filter(image="")
        return queryset


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["thumbnail", "name", "slug", "sort_order", "product_total", "updated_at"]
    list_display_links = ["thumbnail", "name"]
    list_editable = ["sort_order"]
    search_fields = ["name", "slug"]
    list_filter = [HasImageFilter, ("updated_at", RangeDateFilter)]
    list_filter_submit = True
    list_per_page = 25
    ordering = ["sort_order", "name"]
    prepopulated_fields = {"slug": ("name",)}
    # Unfold's file widget shows the current image as a preview above the upload field.
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = [
        ("Category", {"fields": ["name", "slug", "description", "sort_order"]}),
        ("Image", {"fields": ["image"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_product_total=Count("products"))

    @display(description="Image")
    def thumbnail(self, obj):
        return image_thumbnail(obj.image)

    @display(description="Products", ordering="_product_total")
    def product_total(self, obj):
        return obj._product_total
