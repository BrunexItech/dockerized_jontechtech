from rest_framework import serializers
from .models import LatestOffer

class LatestOfferSerializer(serializers.ModelSerializer):
    brand_display = serializers.CharField(source="get_brand_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    price_display = serializers.SerializerMethodField()
    labels = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = LatestOffer
        fields = [
            "id", "name",
            "brand", "brand_display",
            "category", "category_display",
            "slug",
            "price_min_ksh", "price_max_ksh", "old_price_ksh", "price_display",
            "labels",
            "image",
            "product_id",
            "created_at",
        ]
        read_only_fields = ["slug", "created_at", "product_id"]

    def get_price_display(self, obj):
        if obj.price_max_ksh:
            return f"{obj.price_min_ksh:,} – {obj.price_max_ksh:,} KSh"
        return f"{obj.price_min_ksh:,} KSh"

    def get_labels(self, obj):
        return obj.labels

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and hasattr(obj.image, "url"):
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None
