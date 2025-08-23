from django.contrib import admin
from django.utils.html import format_html
from .models import LatestOffer

@admin.register(LatestOffer)
class LatestOfferAdmin(admin.ModelAdmin):
    list_display = ("thumb", "name", "brand", "category", "price_display", "labels_csv", "created_at")
    list_filter = ("brand", "category", "created_at")
    search_fields = ("name", "brand", "category", "labels_csv")
    readonly_fields = ("slug", "image_preview")
    fields = (
        "name", ("brand", "category"), "slug",
        ("price_min_ksh", "price_max_ksh", "old_price_ksh"),
        "labels_csv",
        "image",
        "image_preview",
        "product",
    )

    def price_display(self, obj):
        if obj.price_max_ksh:
            return f"{obj.price_min_ksh:,} – {obj.price_max_ksh:,} KSh"
        return f"{obj.price_min_ksh:,} KSh"
    price_display.short_description = "Price (KSh)"

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:6px;" />', obj.image.url)
        return "—"
    thumb.short_description = ""

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:240px;border-radius:8px;" />', obj.image.url)
        return "No image uploaded"
    image_preview.short_description = "Preview"
