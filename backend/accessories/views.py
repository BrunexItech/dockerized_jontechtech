from rest_framework import generics, filters
from .models import MobileAccessory
from .serializers import MobileAccessorySerializer

class MobileAccessoryListView(generics.ListAPIView):
    """
    GET /api/mobile-accessories/
    Optional query params:
      - brand=Apple|Samsung|Anker|UGreen|Baseus|Oraimo|Xiaomi|Huawei|OnePlus|Amaya|Unbranded
      - category=Chargers|Powerbanks|Phone Covers|Protectors|Cables|Mounts|Earbuds Cases|Others
      - search=<text>   (searches name/specs_text/brand/category)
      - ordering=created_at|price_min_ksh|price_max_ksh|name (prefix with '-' for desc)
      - page, page_size (if DRF pagination enabled)
    """
    serializer_class = MobileAccessorySerializer
    queryset = MobileAccessory.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand", "category"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        category = self.request.query_params.get("category")
        if brand:
            qs = qs.filter(brand__iexact=brand.strip())
        if category:
            qs = qs.filter(category__iexact=category.strip())
        return qs


class MobileAccessoryDetailView(generics.RetrieveAPIView):
    """
    GET /api/mobile-accessories/<int:pk>/
    """
    serializer_class = MobileAccessorySerializer
    queryset = MobileAccessory.objects.all()
