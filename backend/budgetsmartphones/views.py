from django.shortcuts import render

# Create your views here.
from rest_framework import generics, filters
from .models import BudgetSmartphone
from .serializers import BudgetSmartphoneSerializer

class BudgetSmartphoneListView(generics.ListAPIView):
    """
    GET /api/budget-smartphones/
    Optional query params:
      - brand=<brand>
      - badge=<text>  (e.g., OPEN or OPEN HOT)
      - search=<text> (name/specs/brand/badge)
      - ordering=created_at|price_min_ksh|price_max_ksh|name  (prefix with '-' for desc)
    """
    serializer_class = BudgetSmartphoneSerializer
    queryset = BudgetSmartphone.objects.all()
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

class BudgetSmartphoneDetailView(generics.RetrieveAPIView):
    """
    GET /api/budget-smartphones/<int:pk>/
    """
    serializer_class = BudgetSmartphoneSerializer
    queryset = BudgetSmartphone.objects.all()
