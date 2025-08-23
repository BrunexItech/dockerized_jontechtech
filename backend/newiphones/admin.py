from django.contrib import admin
from django.utils.html import format_html
from .models import NewIphone, NewIphoneBanner

@admin.register(NewIphone)
class NewIphoneAdmin(admin.ModelAdmin):
    list_display = ("thumb", "name", "badge", "new_price_display", "old_price_display", "created_at")
    list_filter = ("badge", "created_at")
    search_fields = ("name", "specs_text")
    readonly_fields = ("slug", "image_preview", "banner_preview")
    fields = (
        "name",
        ("new_price_ksh", "old_price_ksh"),
        "badge",
        "slug",
        "specs_text",
        ("image", "banner_image"),
        "image_preview",
        "banner_preview",
        "product",
    )

    def new_price_display(self, obj):
        return f"{obj.new_price_ksh:,} KSh"
    new_price_display.short_description = "Price (KSh)"

    def old_price_display(self, obj):
        return f"{obj.old_price_ksh:,} KSh" if obj.old_price_ksh else "—"
    old_price_display.short_description = "Old Price"

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
    image_preview.short_description = "Image Preview"

    def banner_preview(self, obj):
        # show per-item banner if present
        if obj.banner_image:
            return format_html('<img src="{}" style="max-height:160px;border-radius:8px;width:320px;object-fit:cover;" />', obj.banner_image.url)
        return "No banner uploaded"
    banner_preview.short_description = "Banner Preview"

@admin.register(NewIphoneBanner)
class NewIphoneBannerAdmin(admin.ModelAdmin):
    list_display = ("banner_preview", "created_at")
    readonly_fields = ("banner_preview",)

    def banner_preview(self, obj):
        if obj.banner_image:
            return format_html('<img src="{}" style="max-height:200px;width:420px;object-fit:cover;border-radius:8px;" />', obj.banner_image.url)
        return "No banner uploaded"
    banner_preview.short_description = "Banner Preview"
