from django.db import models
from django.utils.text import slugify
from products.models import Product  # your existing Product model

class StorageDevice(models.Model):
    class Brand(models.TextChoices):
        SANDISK = "SanDisk", "SanDisk"
        WD = "WD", "Western Digital (WD)"
        SEAGATE = "Seagate", "Seagate"
        TOSHIBA = "Toshiba", "Toshiba"
        SAMSUNG = "Samsung", "Samsung"
        CRUCIAL = "Crucial", "Crucial"
        TRANSCEND = "Transcend", "Transcend"
        LACIE = "LaCie", "LaCie"
        VERBATIM = "Verbatim", "Verbatim"
        PNY = "PNY", "PNY"
        OTHERS = "Others", "Others"

    name = models.CharField(max_length=160)
    brand = models.CharField(max_length=32, choices=Brand.choices)
    slug = models.SlugField(max_length=180, unique=True, blank=True)

    # Pricing (KSh)
    price_min_ksh = models.PositiveIntegerField()
    price_max_ksh = models.PositiveIntegerField(null=True, blank=True)

    # Optional structured specs
    capacity_gb = models.PositiveIntegerField(null=True, blank=True)  # e.g. 512, 1000, 2000
    interface = models.CharField(max_length=40, blank=True)           # e.g. USB 3.2, NVMe, SATA
    form_factor = models.CharField(max_length=40, blank=True)         # e.g. 2.5", M.2, Portable

    # Freeform text
    specs_text = models.CharField(max_length=255, blank=True)

    # Image uploaded from admin
    image = models.ImageField(upload_to="storages/")

    # Link to Product used by cart
    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="storage_device",
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
            self.slug = slugify(f"{self.brand}-{self.name}")[:175]
        super().save(*args, **kwargs)
