from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import Television

def _tv_to_product_defaults(tv: Television) -> dict:
    """
    Map Television fields to Product fields.
    Choose price_min_ksh as primary product price; old_price from price_max_ksh.
    """
    title_bits = [tv.name, f'({tv.screen_size_inches}" {tv.panel})']
    return {
        "name": " ".join([b for b in title_bits if b])[:200],
        "brand": tv.brand,
        "price": tv.price_min_ksh or 0,
        "old_price": tv.price_max_ksh or None,
        "desc": tv.specs_text or "",
        "image": tv.image,  # reuse same file
    }

@receiver(post_save, sender=Television)
def ensure_product_for_television(sender, instance: Television, created, **kwargs):
    tv = instance

    def create_or_update():
        if tv.product is None:
            prod = Product.objects.create(**_tv_to_product_defaults(tv))
            Television.objects.filter(pk=tv.pk).update(product=prod)
        else:
            for k, v in _tv_to_product_defaults(tv).items():
                setattr(tv.product, k, v)
            tv.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
