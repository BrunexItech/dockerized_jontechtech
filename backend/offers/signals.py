from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import LatestOffer

def _offer_to_product_defaults(of: LatestOffer) -> dict:
    """
    Map LatestOffer fields to Product fields.
    Use price_min_ksh as primary product price; use old_price from (old_price_ksh or price_max_ksh).
    """
    title_bits = [of.name, f"({of.category})"]
    return {
        "name": " ".join([b for b in title_bits if b])[:200],
        "brand": of.brand,
        "price": of.price_min_ksh or 0,
        "old_price": of.old_price_ksh or of.price_max_ksh or None,
        "desc": ", ".join(of.labels) if of.labels else "",
        "image": of.image,   # reuse same file
    }

@receiver(post_save, sender=LatestOffer)
def ensure_product_for_offer(sender, instance: LatestOffer, created, **kwargs):
    of = instance

    def create_or_update():
        if of.product is None:
            prod = Product.objects.create(**_offer_to_product_defaults(of))
            LatestOffer.objects.filter(pk=of.pk).update(product=prod)
        else:
            for k, v in _offer_to_product_defaults(of).items():
                setattr(of.product, k, v)
            of.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
