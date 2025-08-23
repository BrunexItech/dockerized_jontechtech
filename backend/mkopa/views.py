from rest_framework import generics, filters
from .models import MkopaItem
from .serializers import MkopaItemSerializer

class MkopaItemListView(generics.ListAPIView):
    """
    GET /api/mkopa-items/
    Optional query params:
      - brand=Samsung|M-KOPA|Nokia|Tecno|Infinix|itel|Unbranded
      - category=Smartphones|Feature Phones|Others
      - search=<text>   (searches name/specs_text/brand/category)
      - ordering=created_at|price_min_ksh|price_max_ksh|name|weekly_ksh|deposit_ksh|term_weeks
        (prefix with '-' for desc)
    """
    serializer_class = MkopaItemSerializer
    queryset = MkopaItem.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand", "category"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name", "weekly_ksh", "deposit_ksh", "term_weeks"]
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


class MkopaItemDetailView(generics.RetrieveAPIView):
    """
    GET /api/mkopa-items/<int:pk>/
    """
    serializer_class = MkopaItemSerializer
    queryset = MkopaItem.objects.all()
