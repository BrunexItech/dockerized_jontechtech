from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import StorageDevice

def _storage_to_product_defaults(s: StorageDevice) -> dict:
    """
    Map StorageDevice fields to Product fields.
    Use price_min_ksh as product price; price_max_ksh as old_price.
    """
    return {
        "name": s.name,
        "brand": s.brand,
        "price": s.price_min_ksh or 0,
        "old_price": s.price_max_ksh or None,
        "desc": s.specs_text or "",
        "image": s.image,
    }

@receiver(post_save, sender=StorageDevice)
def ensure_product_for_storage(sender, instance: StorageDevice, created, **kwargs):
    s = instance

    def create_or_update():
        if s.product is None:
            prod = Product.objects.create(**_storage_to_product_defaults(s))
            StorageDevice.objects.filter(pk=s.pk).update(product=prod)
        else:
            for k, v in _storage_to_product_defaults(s).items():
                setattr(s.product, k, v)
            s.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
