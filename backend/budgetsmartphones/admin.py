from django.contrib import admin
from django.utils.html import format_html
from .models import BudgetSmartphone

@admin.register(BudgetSmartphone)
class BudgetSmartphoneAdmin(admin.ModelAdmin):
    list_display = ("thumb", "name", "brand", "price_display", "badge", "created_at")
    list_filter = ("brand", "badge", "created_at")
    search_fields = ("name", "brand", "badge", "specs_text")
    readonly_fields = ("slug", "image_preview")
    fields = (
        "name", "brand", "slug",
        ("price_min_ksh", "price_max_ksh"),
        "badge",
        "specs_text",
        "image",
        "image_preview",
    )

    def price_display(self, obj):
        return obj.price_display()
    price_display.short_description = "Price (KSh)"

    def thumb(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:6px;" />',
                obj.image.url,
            )
        return "—"
    thumb.short_description = ""

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:240px;border-radius:8px;" />', obj.image.url)
        return "No image uploaded"
    image_preview.short_description = "Preview"
