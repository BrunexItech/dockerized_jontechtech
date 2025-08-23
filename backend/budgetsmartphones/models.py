from django.db import models
from django.utils.text import slugify
from products.models import Product  # your base Product used by the cart

class BudgetSmartphone(models.Model):
    class Brand(models.TextChoices):
        XIAOMI = "Xiaomi", "Xiaomi"
        INFINIX = "Infinix", "Infinix"
        SAMSUNG = "Samsung", "Samsung"
        TECNO = "Tecno", "Tecno"
        ITEL = "Itel", "Itel"
        REALME = "Realme", "Realme"
        NOKIA = "Nokia", "Nokia"
        VIVO = "Vivo", "Vivo"
        OPPO = "Oppo", "Oppo"
        VILLAON = "Villaon", "Villaon"
        UNBRANDED = "Unbranded", "Unbranded"

    name = models.CharField(max_length=160)   # e.g. "Xiaomi Redmi A3x"
    brand = models.CharField(max_length=32, choices=Brand.choices)
    slug = models.SlugField(max_length=180, unique=True, blank=True)

    # Pricing (KSh). Use min/max to support ranges like "8,500 – 11,800"
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)  # optional range upper bound

    # Badge shown on the card (e.g., "OPEN", "OPEN HOT"). Keep freeform for flexibility.
    badge = models.CharField(max_length=24, blank=True, default="")

    # Optional short copy shown under the name (keep generic for now)
    specs_text = models.CharField(max_length=255, blank=True, default="")

    # Image
    image = models.ImageField(upload_to="budgetsmartphones/")

    # tie each BudgetSmartphone to a Product used by the cart
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="budget_smartphone",
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

    def price_display(self):
        if self.price_max_ksh:
            return f"{self.price_min_ksh:,} – {self.price_max_ksh:,} KSh"
        return f"{self.price_min_ksh:,} KSh"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.brand}-{self.name}"
            self.slug = slugify(base)[:170]
        super().save(*args, **kwargs)
