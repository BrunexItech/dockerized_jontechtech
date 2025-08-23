from rest_framework import serializers
from .models import NewIphone, NewIphoneBanner

class NewIphoneSerializer(serializers.ModelSerializer):
    price_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    banner_image = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = NewIphone
        fields = [
            "id", "name", "slug",
            "new_price_ksh", "old_price_ksh", "price_display",
            "badge", "specs_text",
            "image", "banner_image",
            "product_id", "created_at",
        ]
        read_only_fields = ["slug", "created_at", "product_id"]

    def get_price_display(self, obj):
        if obj.old_price_ksh:
            return f"{obj.new_price_ksh:,} – {obj.old_price_ksh:,} KSh"
        return f"{obj.new_price_ksh:,} KSh"

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and hasattr(obj.image, "url"):
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_banner_image(self, obj):
        # prefer per-item banner if present, else None (frontend will use global banner)
        request = self.context.get("request")
        if obj.banner_image and hasattr(obj.banner_image, "url"):
            url = obj.banner_image.url
            return request.build_absolute_uri(url) if request else url
        return None


class NewIphoneBannerSerializer(serializers.ModelSerializer):
    banner_image = serializers.SerializerMethodField()

    class Meta:
        model = NewIphoneBanner
        fields = ["id", "banner_image"]

    def get_banner_image(self, obj):
        request = self.context.get("request")
        if obj.banner_image and hasattr(obj.banner_image, "url"):
            url = obj.banner_image.url
            return request.build_absolute_uri(url) if request else url
        return None
