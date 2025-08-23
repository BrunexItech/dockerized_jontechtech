from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import NewIphone
from products.models import Product

def _iphone_to_product_defaults(ni: NewIphone) -> dict:
    """
    Map NewIphone fields to Product fields.
    Use new_price_ksh as price; old_price_ksh as old_price.
    """
    return {
        "name": ni.name[:200],
        "brand": "Apple",
        "price": ni.new_price_ksh or 0,
        "old_price": ni.old_price_ksh or None,
        "desc": ni.specs_text or "",
        "image": ni.image,  # reuse same file
    }

@receiver(post_save, sender=NewIphone)
def ensure_product_for_new_iphone(sender, instance: NewIphone, created, **kwargs):
    ni = instance

    def create_or_update():
        if ni.product is None:
            prod = Product.objects.create(**_iphone_to_product_defaults(ni))
            # set the product FK without re-fetching instance to avoid recursion
            NewIphone.objects.filter(pk=ni.pk).update(product=prod)
        else:
            for k, v in _iphone_to_product_defaults(ni).items():
                setattr(ni.product, k, v)
            ni.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
