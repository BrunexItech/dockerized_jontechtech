from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
from django.core.files.base import ContentFile

class Product(models.Model):
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=120, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    old_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount = models.CharField(max_length=50, blank=True)  # e.g., "10% OFF"
    desc = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# 🛒 Cart

class Cart(models.Model):
    """
    Represents a shopping cart belonging to a user.
    One user has one cart.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart for {self.user.username}"

    @property
    def total_price(self):
        """Calculate total price of items in the cart"""
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    """
    Represents a single product inside a user's cart.
    A cart can have many items, and each item links to a product.
    """
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal(self):
        """Price of this item (product price * quantity)"""
        return self.product.price * self.quantity


# 🧾 Orders

class Order(models.Model):
    PAYMENT_COD = "cod"
    PAYMENT_MPESA = "mpesa"
    PAYMENT_CARD = "card"
    PAYMENT_CHOICES = [
        (PAYMENT_COD, "Cash on Delivery"),
        (PAYMENT_MPESA, "Mpesa"),
        (PAYMENT_CARD, "Card"),
    ]

    STATUS_PENDING = "PENDING"
    STATUS_PAID = "PAID"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_FULFILLED = "FULFILLED"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_FULFILLED, "Fulfilled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")

    # denormalized totals
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default=PAYMENT_COD)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_PENDING)

    # shipping address
    ship_full_name = models.CharField(max_length=255)
    ship_phone = models.CharField(max_length=64)
    ship_address1 = models.CharField(max_length=255)
    ship_address2 = models.CharField(max_length=255, blank=True)
    ship_city = models.CharField(max_length=128)
    ship_country = models.CharField(max_length=128, default="Kenya")

    # billing (minimal)
    bill_name_on_card = models.CharField(max_length=255, blank=True)
    bill_tax_id = models.CharField(max_length=64, blank=True)

    # receipt tracking
    receipt_number = models.CharField(max_length=32, unique=True, blank=True)
    receipt_pdf = models.FileField(upload_to="receipts/", null=True, blank=True)
    receipt_generated_at = models.DateTimeField(null=True, blank=True)
    receipt_sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.name} x {self.quantity}"
