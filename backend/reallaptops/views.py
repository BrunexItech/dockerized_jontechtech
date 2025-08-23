# reallaptops/views.py
from rest_framework import generics, filters
from .models import RealLaptop
from .serializers import RealLaptopSerializer

class RealLaptopListView(generics.ListAPIView):
    """
    GET /api/reallaptops/
    Optional query params:
      - brand=<any free-form brand, case-insensitive>
      - search=<text>
      - ordering=created_at|price_min_ksh|price_max_ksh|name (prefix '-' for desc)
    """
    serializer_class = RealLaptopSerializer
    queryset = RealLaptop.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        if brand:
            qs = qs.filter(brand__iexact=brand.strip())
        return qs

class RealLaptopDetailView(generics.RetrieveAPIView):
    serializer_class = RealLaptopSerializer
    queryset = RealLaptop.objects.all()
