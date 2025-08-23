from rest_framework import generics, filters
from .models import LatestOffer
from .serializers import LatestOfferSerializer

class LatestOfferListView(generics.ListAPIView):
    """
    GET /api/latest-offers/
    Optional query params:
      - brand
      - category
      - search (name/brand/category/labels)
      - ordering: created_at|price_min_ksh|price_max_ksh|name  (prefix with '-' for desc)
      - page, page_size (if pagination is enabled globally)
    """
    serializer_class = LatestOfferSerializer
    queryset = LatestOffer.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "brand", "category", "labels_csv"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["-created_at", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        category = self.request.query_params.get("category")
        if brand:
            qs = qs.filter(brand__iexact=brand.strip())
        if category:
            qs = qs.filter(category__iexact=category.strip())
        return qs

class LatestOfferDetailView(generics.RetrieveAPIView):
    """
    GET /api/latest-offers/<int:pk>/
    """
    serializer_class = LatestOfferSerializer
    queryset = LatestOffer.objects.all()
