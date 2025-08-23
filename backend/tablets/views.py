from rest_framework import generics, filters
from .models import Tablet
from .serializers import TabletSerializer

class TabletListView(generics.ListAPIView):
    """
    GET /api/tablets/
    Optional query params:
      - brand=Samsung|Apple|Lenovo|Huawei|Tablets for Kids|Others
      - search=<text>   (searches name/specs_text/brand)
      - ordering=created_at|price_min_ksh|price_max_ksh|name (prefix with '-' for desc)
    """
    serializer_class = TabletSerializer
    queryset = Tablet.objects.all()  # DRF 'ordering' handles default order
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        if brand:
            # Accept case-insensitive and both "TabletsForKids" and "Tablets for Kids"
            normalized = brand.strip().lower().replace(" ", "")
            if normalized == "tabletsforkids":
                qs = qs.filter(brand="Tablets for Kids")
            else:
                qs = qs.filter(brand__iexact=brand)
        return qs


class TabletDetailView(generics.RetrieveAPIView):
    """
    GET /api/tablets/<int:pk>/
    """
    serializer_class = TabletSerializer
    queryset = Tablet.objects.all()
