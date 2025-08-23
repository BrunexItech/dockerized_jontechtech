from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import RealLaptop

def _rl_to_product_defaults(rl: RealLaptop) -> dict:
    return {
        "name": rl.name,
        "brand": rl.brand,
        "price": rl.price_min_ksh or 0,
        "old_price": rl.price_max_ksh or None,
        "desc": rl.specs_text or "",
        "image": rl.image,
    }

@receiver(post_save, sender=RealLaptop)
def ensure_product_for_reallaptop(sender, instance: RealLaptop, created, **kwargs):
    rl = instance

    def create_or_update():
        if rl.product is None:
            prod = Product.objects.create(**_rl_to_product_defaults(rl))
            RealLaptop.objects.filter(pk=rl.pk).update(product=prod)
        else:
            for k, v in _rl_to_product_defaults(rl).items():
                setattr(rl.product, k, v)
            rl.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
