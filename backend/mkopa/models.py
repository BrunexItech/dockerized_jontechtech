from django.db import models
from django.utils.text import slugify
from products.models import Product  # same base Product used by cart

class MkopaItem(models.Model):
    class Brand(models.TextChoices):
        SAMSUNG = "Samsung", "Samsung"
        MKOPA = "M-KOPA", "M-KOPA"
        NOKIA = "Nokia", "Nokia"
        TECNO = "Tecno", "Tecno"
        INFINIX = "Infinix", "Infinix"
        ITEL = "itel", "itel"
        UNBRANDED = "Unbranded", "Unbranded"

    class Category(models.TextChoices):
        SMARTPHONES = "Smartphones", "Smartphones"
        FEATURE_PHONES = "Feature Phones", "Feature Phones"
        OTHERS = "Others", "Others"

    name = models.CharField(max_length=120)
    brand = models.CharField(max_length=32, choices=Brand.choices)
    category = models.CharField(max_length=20, choices=Category.choices)
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    # Base cash price range (optional high/low, just like Audio)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Financing terms
    deposit_ksh = models.PositiveIntegerField(default=0)
    weekly_ksh = models.PositiveIntegerField(default=0)
    term_weeks = models.PositiveSmallIntegerField(default=0)

    # Specs and image
    specs_text = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="mkopa/")

    # Tie to cart Product (exactly like Audio pattern)
    product = models.OneToOneField(
        Product,
        null=True, blank=True,                 # left nullable to match your Audio flow (+post_save filler)
        on_delete=models.SET_NULL,
        related_name="mkopa_item",
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
