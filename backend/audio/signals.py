from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import AudioDevice

def _audio_to_product_defaults(ad: AudioDevice) -> dict:
    """
    Map AudioDevice fields to Product fields.
    Choose price_min_ksh as primary product price; old_price from price_max_ksh.
    """
    title_bits = [ad.name, f"({ad.category})"]
    return {
        "name": " ".join([b for b in title_bits if b])[:200],
        "brand": ad.brand,
        "price": ad.price_min_ksh or 0,
        "old_price": ad.price_max_ksh or None,
        "desc": ad.specs_text or "",
        "image": ad.image,   # reuse same file
    }

@receiver(post_save, sender=AudioDevice)
def ensure_product_for_audio(sender, instance: AudioDevice, created, **kwargs):
    ad = instance

    def create_or_update():
        if ad.product is None:
            prod = Product.objects.create(**_audio_to_product_defaults(ad))
            AudioDevice.objects.filter(pk=ad.pk).update(product=prod)
        else:
            for k, v in _audio_to_product_defaults(ad).items():
                setattr(ad.product, k, v)
            ad.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
