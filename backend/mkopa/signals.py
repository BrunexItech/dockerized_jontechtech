from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import MkopaItem

def _mkopa_to_product_defaults(mi: MkopaItem) -> dict:
    """
    Map MkopaItem fields to Product fields.
    Choose price_min_ksh as primary product price; old_price from price_max_ksh.
    """
    title_bits = [mi.name, f"({mi.category})"]
    return {
        "name": " ".join([b for b in title_bits if b])[:200],
        "brand": mi.brand,
        "price": mi.price_min_ksh or 0,
        "old_price": mi.price_max_ksh or None,
        "desc": (mi.specs_text or ""),
        "image": mi.image,   # reuse same file
    }

@receiver(post_save, sender=MkopaItem)
def ensure_product_for_mkopa(sender, instance: MkopaItem, created, **kwargs):
    mi = instance

    def create_or_update():
        if mi.product is None:
            prod = Product.objects.create(**_mkopa_to_product_defaults(mi))
            MkopaItem.objects.filter(pk=mi.pk).update(product=prod)
        else:
            for k, v in _mkopa_to_product_defaults(mi).items():
                setattr(mi.product, k, v)
            mi.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
