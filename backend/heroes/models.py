# heroes/models.py
from django.db import models

class Hero(models.Model):
    CATEGORY_CHOICES = [
        ("hero", "Hero Slider"),
        ("product", "Product Card"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to="uploads/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.category})"
