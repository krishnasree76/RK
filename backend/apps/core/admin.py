from django.utils.html import format_html


def image_thumbnail(image, *, size="sm"):
    """Small preview used in admin change lists."""
    if image:
        return format_html('<img src="{}" alt="" class="rk-thumb rk-thumb--{}" loading="lazy">', image.url, size)
    return format_html('<span class="rk-thumb rk-thumb--{} rk-thumb--empty">No image</span>', size)
