from django.db import models
from django.utils.text import slugify
from products.models import Product  # base Product used by the cart

class Television(models.Model):
    class Brand(models.TextChoices):
        SAMSUNG = "Samsung", "Samsung"
        LG = "LG", "LG"
        SONY = "Sony", "Sony"
        HISENSE = "Hisense", "Hisense"
        VITRON = "Vitron", "Vitron"
        TCL = "TCL", "TCL"
        UNBRANDED = "Unbranded", "Unbranded"

    class Panel(models.TextChoices):
        LED = "LED", "LED"
        QLED = "QLED", "QLED"
        OLED = "OLED", "OLED"
        NANOCELL = "NanoCell", "NanoCell"
        CRYSTAL = "Crystal", "Crystal"
        OTHER = "Other", "Other"

    class Resolution(models.TextChoices):
        HD = "HD", "HD (720p)"
        FHD = "FHD", "Full HD (1080p)"
        UHD_4K = "UHD", "4K UHD"
        UHD_8K = "8K", "8K"

    name = models.CharField(max_length=160)
    brand = models.CharField(max_length=24, choices=Brand.choices)
    screen_size_inches = models.PositiveSmallIntegerField(help_text="Diagonal size in inches, e.g. 55")
    panel = models.CharField(max_length=16, choices=Panel.choices, default=Panel.LED)
    resolution = models.CharField(max_length=8, choices=Resolution.choices, default=Resolution.UHD_4K)
    smart = models.BooleanField(default=True)
    hdr = models.BooleanField(default=True)
    refresh_rate_hz = models.PositiveSmallIntegerField(null=True, blank=True)

    slug = models.SlugField(max_length=180, unique=True, blank=True)

    # Pricing (KSh)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Freeform specs
    specs_text = models.CharField(max_length=255, blank=True)

    image = models.ImageField(upload_to="televisions/")

    # tie each Television to a Product used by the cart
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="television",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["brand", "screen_size_inches", "name"]
        indexes = [
            models.Index(fields=["brand"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["resolution"]),
            models.Index(fields=["panel"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.brand} · {self.screen_size_inches}\")"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.brand}-{self.screen_size_inches}in-{self.panel}-{self.name}"
            self.slug = slugify(base)[:170]
        super().save(*args, **kwargs)
