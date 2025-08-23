from django.db import models
from django.utils.text import slugify
from products.models import Product  # base Product used by the cart

class LatestOffer(models.Model):
    class Brand(models.TextChoices):
        SAMSUNG = "Samsung", "Samsung"
        XIAOMI = "Xiaomi", "Xiaomi"
        REALME = "realme", "realme"
        TECNO = "Tecno", "Tecno"
        INFINIX = "Infinix", "Infinix"
        APPLE = "Apple", "Apple"
        VIVO = "Vivo", "Vivo"
        OTHER = "Other", "Other"

    class Category(models.TextChoices):
        SMARTPHONE = "Smartphone", "Smartphone"
        ACCESSORY = "Accessory", "Accessory"
        TABLET = "Tablet", "Tablet"
        TV = "Television", "Television"
        LAPTOP = "Laptop", "Laptop"
        OTHER = "Other", "Other"

    # Basic
    name = models.CharField(max_length=160)
    brand = models.CharField(max_length=24, choices=Brand.choices, default=Brand.OTHER)
    category = models.CharField(max_length=24, choices=Category.choices, default=Category.OTHER)
    slug = models.SlugField(max_length=180, unique=True, blank=True)

    # Pricing (KSh)
    # your UI shows either a single price OR a min–max range plus an optional old price
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)  # for displaying ranges
    old_price_ksh = models.PositiveIntegerField(null=True, blank=True)  # for strikethrough SALE

    # Labels like ["NEW","HOT","SALE","realme"] — store as CSV to keep MySQL/SQLite friendliness
    labels_csv = models.CharField(max_length=160, blank=True, help_text="Comma-separated labels, e.g. NEW,HOT,SALE")

    image = models.ImageField(upload_to="offers/")

    # Tie each LatestOffer to a Product used by the cart
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="latest_offer",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "name"]
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["category"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.name} · {self.brand} ({self.category})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.brand}-{self.category}-{self.name}"
            self.slug = slugify(base)[:175]
        super().save(*args, **kwargs)

    @property
    def labels(self):
        return [s.strip() for s in (self.labels_csv or "").split(",") if s.strip()]
