# dialphones/views.py
from rest_framework import generics, filters
from .models import DialPhoneDeal
from .serializers import DialPhoneDealSerializer

class DialPhoneDealListView(generics.ListAPIView):
    """
    GET /api/dial-phones/
    Optional query params:
      - brand=<brand>
      - badge=<badge>
      - search=<text>
      - ordering=created_at|price_min_ksh|price_max_ksh|name (prefix with '-' for desc)
    """
    serializer_class = DialPhoneDealSerializer
    queryset = DialPhoneDeal.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand", "badge"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        badge = self.request.query_params.get("badge")
        if brand:
            qs = qs.filter(brand__iexact=brand.strip())
        if badge:
            qs = qs.filter(badge__iexact=badge.strip())
        return qs


class DialPhoneDealDetailView(generics.RetrieveAPIView):
    """
    GET /api/dial-phones/<int:pk>/
    """
    serializer_class = DialPhoneDealSerializer
    queryset = DialPhoneDeal.objects.all()
