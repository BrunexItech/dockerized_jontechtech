from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import MobileAccessory

def _accessory_to_product_defaults(acc: MobileAccessory) -> dict:
    """
    Map MobileAccessory fields to Product fields.
    Use price_min_ksh as primary product price; old_price from price_max_ksh.
    """
    title_bits = [acc.name, f"({acc.category})"]
    return {
        "name": " ".join([b for b in title_bits if b])[:200],
        "brand": acc.brand,
        "price": acc.price_min_ksh or 0,
        "old_price": acc.price_max_ksh or None,
        "desc": acc.specs_text or "",
        "image": acc.image,   # reuse same file
    }

@receiver(post_save, sender=MobileAccessory)
def ensure_product_for_accessory(sender, instance: MobileAccessory, created, **kwargs):
    acc = instance

    def create_or_update():
        if acc.product is None:
            prod = Product.objects.create(**_accessory_to_product_defaults(acc))
            MobileAccessory.objects.filter(pk=acc.pk).update(product=prod)
        else:
            for k, v in _accessory_to_product_defaults(acc).items():
                setattr(acc.product, k, v)
            acc.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    # Guarantee creation after the accessory commits, just like Audio
    transaction.on_commit(create_or_update)
