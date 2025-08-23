from rest_framework import serializers
from .models import Product, Cart, CartItem, Order, OrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "brand",
            "price",
            "old_price",
            "discount",
            "desc",
            "image",
            "created_at",
        ]


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items"]


# Orders

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product", "name", "unit_price", "quantity", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    receipt_number = serializers.CharField(read_only=True)
    receipt_pdf_url = serializers.SerializerMethodField()
    receipt_generated_at = serializers.DateTimeField(read_only=True)
    receipt_sent_at = serializers.DateTimeField(read_only=True)

    def get_receipt_pdf_url(self, obj):
        request = self.context.get("request")
        if obj.receipt_pdf and request:
            return request.build_absolute_uri(f"/api/orders/{obj.id}/receipt/download/")
        return None

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "subtotal",
            "shipping_fee",
            "total",
            "payment_method",
            "created_at",
            "items",
            "receipt_number",
            "receipt_pdf_url",
            "receipt_generated_at",
            "receipt_sent_at",
        ]
