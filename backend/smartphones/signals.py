# smartphones/signals.py
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import Smartphone

def _phone_to_product_defaults(ph: Smartphone) -> dict:
    """
    Map Smartphone fields to Product fields.
    Using price_min_ksh for Product.price; old_price from price_max_ksh.
    """
    desc_bits = []
    if ph.specs_text:
        desc_bits.append(ph.specs_text)
    for txt in [
        f"{ph.ram_gb}GB RAM" if ph.ram_gb else None,
        f"{ph.storage_gb}GB Storage" if ph.storage_gb else None,
        f"{ph.camera_mp}MP Camera" if ph.camera_mp else None,
        f"{ph.battery_mah} mAh" if ph.battery_mah else None,
        f'{ph.display_inches}" {ph.display_type}'.strip() if ph.display_inches else None,
    ]:
        if txt:
            desc_bits.append(txt)

    return {
        "name": ph.name,
        "brand": ph.brand,
        "price": ph.price_min_ksh or 0,
        "old_price": ph.price_max_ksh or None,
        "desc": " | ".join(desc_bits),
        "image": ph.image,  # reuse same file
    }

@receiver(post_save, sender=Smartphone)
def ensure_product_for_smartphone(sender, instance: Smartphone, created, **kwargs):
    ph = instance

    def create_or_update():
        if ph.product is None:
            prod = Product.objects.create(**_phone_to_product_defaults(ph))
            Smartphone.objects.filter(pk=ph.pk).update(product=prod)
        else:
            for k, v in _phone_to_product_defaults(ph).items():
                setattr(ph.product, k, v)
            ph.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
