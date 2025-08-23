from django.db import models
from django.utils.text import slugify
from products.models import Product

class NewIphone(models.Model):
    class Badge(models.TextChoices):
        HOT = "HOT", "Hot"
        NEW = "NEW", "New"
        SALE = "SALE", "Sale"
        NONE = "NONE", "None"

    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)

    new_price_ksh = models.PositiveIntegerField()
    old_price_ksh = models.PositiveIntegerField(null=True, blank=True)

    badge = models.CharField(max_length=8, choices=Badge.choices, default=Badge.NONE)
    specs_text = models.CharField(max_length=255, blank=True)

    image = models.ImageField(upload_to="new_iphones/")
    # kept for per-item banner if needed, but not used as the master banner:
    banner_image = models.ImageField(upload_to="new_iphones/banners/", null=True, blank=True)

    product = models.OneToOneField(
        Product,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="new_iphone",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.name}"
            self.slug = slugify(base)[:170]
        super().save(*args, **kwargs)


class NewIphoneBanner(models.Model):
    """
    Singleton-ish model to hold one banner image for the New iPhones page.
    Admin users can upload (create) a single row; the API will return the first object.
    """
    banner_image = models.ImageField(upload_to="new_iphones/global_banner/")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "New iPhones Banner"
        verbose_name_plural = "New iPhones Banner"

    def __str__(self):
        return "New iPhones Banner"
