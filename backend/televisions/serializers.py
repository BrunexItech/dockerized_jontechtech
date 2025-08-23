from rest_framework import serializers
from .models import Television

class TelevisionSerializer(serializers.ModelSerializer):
    brand_display = serializers.CharField(source="get_brand_display", read_only=True)
    panel_display = serializers.CharField(source="get_panel_display", read_only=True)
    resolution_display = serializers.CharField(source="get_resolution_display", read_only=True)
    price_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = Television
        fields = [
            "id", "name", "brand", "brand_display",
            "screen_size_inches", "panel", "panel_display",
            "resolution", "resolution_display",
            "smart", "hdr", "refresh_rate_hz",
            "slug",
            "price_min_ksh", "price_max_ksh", "price_display",
            "specs_text", "image",
            "product_id",
            "created_at",
        ]
        read_only_fields = ["slug", "created_at", "product_id"]

    def get_price_display(self, obj):
        if obj.price_max_ksh:
            return f"{obj.price_min_ksh:,} – {obj.price_max_ksh:,} KSh"
        return f"{obj.price_min_ksh:,} KSh"

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and hasattr(obj.image, "url"):
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None
