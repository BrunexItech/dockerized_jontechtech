from django.db import models
from django.utils.text import slugify
from products.models import Product  # base Product used by the cart

class MobileAccessory(models.Model):
    class Brand(models.TextChoices):
        APPLE = "Apple", "Apple"
        SAMSUNG = "Samsung", "Samsung"
        ANKER = "Anker", "Anker"
        UGREEN = "UGreen", "UGreen"
        BASEUS = "Baseus", "Baseus"
        ORAIMO = "Oraimo", "Oraimo"
        XIAOMI = "Xiaomi", "Xiaomi"
        HUAWEI = "Huawei", "Huawei"
        ONEPLUS = "OnePlus", "OnePlus"
        AMAYA = "Amaya", "Amaya"
        UNBRANDED = "Unbranded", "Unbranded"

    class Category(models.TextChoices):
        CHARGERS = "Chargers", "Chargers"
        POWERBANKS = "Powerbanks", "Powerbanks"
        PHONE_COVERS = "Phone Covers", "Phone Covers"
        PROTECTORS = "Protectors", "Protectors"
        CABLES = "Cables", "Cables"
        MOUNTS = "Mounts", "Mounts"
        EARBUDS_CASES = "Earbuds Cases", "Earbuds Cases"
        OTHERS = "Others", "Others"

    name = models.CharField(max_length=120)
    brand = models.CharField(max_length=32, choices=Brand.choices)
    category = models.CharField(max_length=20, choices=Category.choices)
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    # Pricing (KSh)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Freeform specs
    specs_text = models.CharField(max_length=255, blank=True)

    image = models.ImageField(upload_to="accessories/")

    # Tie each accessory to a Product used by the cart
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="accessory",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["brand", "name"]
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["category"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.brand} · {self.category})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.brand}-{self.category}-{self.name}"
            self.slug = slugify(base)[:150]
        super().save(*args, **kwargs)
