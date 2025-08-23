from django.contrib import admin
from django.utils.html import format_html
from .models import Television

@admin.register(Television)
class TelevisionAdmin(admin.ModelAdmin):
    list_display = (
        "thumb", "name", "brand", "screen_size_inches",
        "panel", "resolution", "price_display", "smart", "hdr",
        "created_at"
    )
    list_filter = ("brand", "panel", "resolution", "smart", "hdr", "created_at")
    search_fields = ("name", "brand", "specs_text", "slug")
    readonly_fields = ("slug", "image_preview")
    fields = (
        "name",
        ("brand", "screen_size_inches"),
        ("panel", "resolution"),
        ("smart", "hdr", "refresh_rate_hz"),
        "slug",
        ("price_min_ksh", "price_max_ksh"),
        "specs_text",
        "image",
        "image_preview",
    )

    def price_display(self, obj):
        if obj.price_max_ksh:
            return f"{obj.price_min_ksh:,} – {obj.price_max_ksh:,} KSh"
        return f"{obj.price_min_ksh:,} KSh"
    price_display.short_description = "Price (KSh)"

    def thumb(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:6px;" />',
                obj.image.url
            )
        return "—"
    thumb.short_description = ""

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:240px;border-radius:8px;" />', obj.image.url)
        return "No image uploaded"
    image_preview.short_description = "Preview"
