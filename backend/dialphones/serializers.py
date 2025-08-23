# dialphones/serializers.py
from rest_framework import serializers
from .models import DialPhoneDeal

class DialPhoneDealSerializer(serializers.ModelSerializer):
    price_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = DialPhoneDeal
        fields = [
            "id", "name", "brand", "slug",
            "price_min_ksh", "price_max_ksh", "price_display",
            "badge", "specs_text",
            "image",
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
