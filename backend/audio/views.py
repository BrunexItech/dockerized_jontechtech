from rest_framework import generics, filters
from .models import AudioDevice
from .serializers import AudioDeviceSerializer

class AudioDeviceListView(generics.ListAPIView):
    """
    GET /api/audio-devices/
    Optional query params:
      - brand=JBL|Sony|Samsung|Anker|Harman Kardon|Bose|Unbranded
      - category=Buds|Earphones|Speakers|Headphones|Soundbars|Microphones|Others
      - search=<text>   (searches name/specs_text/brand/category)
      - ordering=created_at|price_min_ksh|price_max_ksh|name (prefix with '-' for desc)
    """
    serializer_class = AudioDeviceSerializer
    queryset = AudioDevice.objects.all()
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


class AudioDeviceDetailView(generics.RetrieveAPIView):
    """
    GET /api/audio-devices/<int:pk>/
    """
    serializer_class = AudioDeviceSerializer
    queryset = AudioDevice.objects.all()
