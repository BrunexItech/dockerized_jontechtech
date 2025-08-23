from django.db import models
from django.utils.text import slugify
from products.models import Product  # base Product used by the cart

class AudioDevice(models.Model):
    class Brand(models.TextChoices):
        JBL = "JBL", "JBL"
        SONY = "Sony", "Sony"
        SAMSUNG = "Samsung", "Samsung"
        ANKER = "Anker", "Anker"
        HARMAN_KARDON = "Harman Kardon", "Harman Kardon"
        BOSE = "Bose", "Bose"
        UNBRANDED = "Unbranded", "Unbranded"  # safe fallback for migrated rows

    class Category(models.TextChoices):
        BUDS = "Buds", "Buds"
        EARPHONES = "Earphones", "Earphones"   # ← moved here
        SPEAKERS = "Speakers", "Speakers"
        HEADPHONES = "Headphones", "Headphones"
        SOUNDBARS = "Soundbars", "Soundbars"
        MICROPHONES = "Microphones", "Microphones"
        OTHERS = "Others", "Others"            # ← moved here

    name = models.CharField(max_length=120)
    brand = models.CharField(max_length=32, choices=Brand.choices)
    category = models.CharField(max_length=20, choices=Category.choices)
    slug = models.SlugField(max_length=160, unique=True, blank=True)

    # Pricing (KSh)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Freeform/structured specs
    specs_text = models.CharField(max_length=255, blank=True)
    wireless = models.BooleanField(default=True)
    anc = models.BooleanField("Active Noise Cancelling", default=False)
    battery_life_hours = models.PositiveSmallIntegerField(null=True, blank=True)

    image = models.ImageField(upload_to="audio/")

    # tie each AudioDevice to a Product used by the cart
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="audio_device",
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
