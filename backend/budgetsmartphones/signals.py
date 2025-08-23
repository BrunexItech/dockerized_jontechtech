from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from products.models import Product
from .models import BudgetSmartphone

def _phone_to_product_defaults(p: BudgetSmartphone) -> dict:
    """
    Map BudgetSmartphone fields to Product fields.
    price := price_min_ksh; old_price (if any) := price_max_ksh
    """
    title = p.name
    return {
        "name": title[:200],
        "brand": p.brand,
        "price": p.price_min_ksh or 0,
        "old_price": p.price_max_ksh or None,
        "desc": p.specs_text or "",
        "image": p.image,  # reuse same file
    }

@receiver(post_save, sender=BudgetSmartphone)
def ensure_product_for_budget_phone(sender, instance: BudgetSmartphone, created, **kwargs):
    phone = instance

    def create_or_update():
        if phone.product is None:
            prod = Product.objects.create(**_phone_to_product_defaults(phone))
            BudgetSmartphone.objects.filter(pk=phone.pk).update(product=prod)
        else:
            for k, v in _phone_to_product_defaults(phone).items():
                setattr(phone.product, k, v)
            phone.product.save(update_fields=["name", "brand", "price", "old_price", "desc", "image"])

    transaction.on_commit(create_or_update)
