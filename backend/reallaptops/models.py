# reallaptops/models.py
from django.db import models
from django.utils.text import slugify
from products.models import Product

class RealLaptop(models.Model):
    name = models.CharField(max_length=120)
    # CHANGED: simple CharField
    brand = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    ram_gb = models.PositiveSmallIntegerField(null=True, blank=True)
    storage_gb = models.PositiveSmallIntegerField(null=True, blank=True)
    display_inches = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    display_type = models.CharField(max_length=40, blank=True)

    specs_text = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="reallaptops/")

    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="reallaptop",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["brand", "name"]
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.brand})" if self.brand else self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.brand}-{self.name}" if self.brand else self.name
            self.slug = slugify(base)[:150]
        super().save(*args, **kwargs)
