# heroes/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Hero

@admin.register(Hero)
class HeroAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "image_preview", "created_at")
    list_filter = ("category",)
    search_fields = ("title", "description")
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        if obj.image:
            return format_html("<img src='{}' style='height:60px;' />", obj.image.url)
        return "No Image"
    image_preview.short_description = "Preview"
