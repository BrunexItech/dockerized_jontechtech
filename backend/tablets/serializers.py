# tablets/serializers.py
from rest_framework import serializers
from .models import Tablet

class TabletSerializer(serializers.ModelSerializer):
    brand_display = serializers.CharField(source="get_brand_display", read_only=True)
    price_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()  # absolute URL, matches model name
    # send Decimal as number to the frontend
    display_inches = serializers.FloatField(required=False, allow_null=True)

    # Expose the linked Product id for cart operations
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = Tablet
        fields = [
            "id", "name", "brand", "brand_display", "slug",
            "price_min_ksh", "price_max_ksh", "price_display",
            "ram_gb", "storage_gb", "display_inches", "display_type",
            "specs_text", "image",
            "product_id",            # ← added
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
