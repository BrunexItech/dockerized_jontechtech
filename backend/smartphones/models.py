# smartphones/models.py
from django.db import models
from django.utils.text import slugify
from products.models import Product  # reuse your existing Product model

class Smartphone(models.Model):
    class Brand(models.TextChoices):
        SAMSUNG = "Samsung", "Samsung"
        APPLE = "Apple", "Apple"
        TECNO = "Tecno", "Tecno"
        INFINIX = "Infinix", "Infinix"
        XIAOMI_POCO = "Xiaomi/POCO", "Xiaomi/POCO"
        OPPO = "OPPO", "OPPO"
        OTHERS = "Others", "Others"

    name = models.CharField(max_length=120)
    brand = models.CharField(max_length=32, choices=Brand.choices)
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    # Pricing (KSh)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Optional structured specs
    ram_gb = models.PositiveSmallIntegerField(null=True, blank=True)
    storage_gb = models.PositiveSmallIntegerField(null=True, blank=True)
    battery_mah = models.PositiveIntegerField(null=True, blank=True)
    camera_mp = models.PositiveSmallIntegerField(null=True, blank=True)
    display_inches = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    display_type = models.CharField(max_length=40, blank=True)

    # Freeform specs text
    specs_text = models.CharField(max_length=255, blank=True)

    # Image uploaded from admin
    image = models.ImageField(upload_to="smartphones/")

    # one Product per Smartphone (cart item)
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="smartphone",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["brand", "name"]
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.brand})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.brand}-{self.name}"
            self.slug = slugify(base)[:150]
        super().save(*args, **kwargs)
