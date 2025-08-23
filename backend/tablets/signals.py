# tablets/signals.py
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import Tablet


def _tablet_to_product_defaults(tb: Tablet) -> dict:
    """
    Map Tablet fields to Product fields.
    - Choose a pricing rule: here we use price_min_ksh as the product price.
    - You can extend to set old_price/discount/desc, etc.
    """
    return {
        "name": tb.name,
        "brand": tb.brand,
        "price": tb.price_min_ksh or 0,   # KSh integer -> DecimalField accepts ints
        "old_price": tb.price_max_ksh or None,
        "desc": tb.specs_text or "",
        "image": tb.image,                # reuse same file (optional)
    }


@receiver(post_save, sender=Tablet)
def ensure_product_for_tablet(sender, instance: Tablet, created, **kwargs):
    """
    Ensure every Tablet has a linked Product.
    - On first create: create a Product if missing.
    - On every save: sync key fields back to the Product.
    """
    tb = instance

    def create_or_update():
        if tb.product is None:
            # Create the product, then link it back to the tablet
            prod = Product.objects.create(**_tablet_to_product_defaults(tb))
            # Avoid re-triggering this signal unnecessarily: update only this Tablet field
            Tablet.objects.filter(pk=tb.pk).update(product=prod)
        else:
            # Keep Product fields in sync when Tablet changes
            for k, v in _tablet_to_product_defaults(tb).items():
                setattr(tb.product, k, v)
            tb.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    # Run after the outer transaction commits (safer for admin/import flows)
    transaction.on_commit(create_or_update)
