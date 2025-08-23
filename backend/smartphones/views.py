# smartphones/views.py
from rest_framework import generics, filters
from .models import Smartphone
from .serializers import SmartphoneSerializer

class SmartphoneListView(generics.ListAPIView):
    """
    GET /api/smartphones/
    Optional query params:
      - brand=Samsung|Apple|Tecno|Infinix|Xiaomi/POCO|OPPO|Others
      - search=<text>   (searches name/specs_text/brand)
      - ordering=created_at|price_min_ksh|price_max_ksh|name (-prefix for desc)
    """
    serializer_class = SmartphoneSerializer
    queryset = Smartphone.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        if brand:
            normalized = brand.strip().lower().replace(" ", "").replace("_", "").replace("-", "")
            # normalize common variants
            if normalized in {"xiaomipoco", "xiaomi/poco"}:
                qs = qs.filter(brand="Xiaomi/POCO")
            else:
                qs = qs.filter(brand__iexact=brand)
        return qs

class SmartphoneDetailView(generics.RetrieveAPIView):
    """
    GET /api/smartphones/<int:pk>/
    """
    serializer_class = SmartphoneSerializer
    queryset = Smartphone.objects.all()
