# dialphones/signals.py
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import DialPhoneDeal

def _dialphone_to_product_defaults(dp: DialPhoneDeal) -> dict:
    """
    Map DialPhoneDeal fields to Product fields.
    Use price_min_ksh as primary product price; old_price from price_max_ksh.
    """
    title_bits = [dp.name, f"({dp.brand})"] if dp.brand else [dp.name]
    return {
        "name": " ".join([b for b in title_bits if b])[:200],
        "brand": dp.brand,
        "price": dp.price_min_ksh or 0,
        "old_price": dp.price_max_ksh or None,
        "desc": dp.specs_text or dp.badge or "",
        "image": dp.image,   # reuse same file
    }

@receiver(post_save, sender=DialPhoneDeal)
def ensure_product_for_dialphone(sender, instance: DialPhoneDeal, created, **kwargs):
    dp = instance

    def create_or_update():
        if dp.product is None:
            prod = Product.objects.create(**_dialphone_to_product_defaults(dp))
            # link back to dialphone without causing recursive signal
            DialPhoneDeal.objects.filter(pk=dp.pk).update(product=prod)
        else:
            # update existing product fields
            for k, v in _dialphone_to_product_defaults(dp).items():
                setattr(dp.product, k, v)
            dp.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
