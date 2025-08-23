# dialphones/models.py
from django.db import models
from django.utils.text import slugify
from products.models import Product  # base Product used by the cart

class DialPhoneDeal(models.Model):
    name = models.CharField(max_length=120)
    brand = models.CharField(max_length=64)                   # free text brand
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    # Pricing in KSh (mirror audio naming)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Fields matching your DialPhones.jsx
    badge = models.CharField(max_length=50, blank=True)
    specs_text = models.CharField(max_length=255, blank=True)

    image = models.ImageField(upload_to="dialphones/")

    # tie each DialPhoneDeal to a Product used by the cart (same pattern as audio)
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="dialphone_deal",
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
