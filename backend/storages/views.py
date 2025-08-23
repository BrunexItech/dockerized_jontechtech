from rest_framework import generics, filters
from .models import StorageDevice
from .serializers import StorageDeviceSerializer

class StorageDeviceListView(generics.ListAPIView):
    """
    GET /api/storages/
    Optional query params:
      - brand=SanDisk|WD|Seagate|Toshiba|Samsung|Crucial|Transcend|LaCie|Verbatim|PNY|Others
      - search=<text> (searches name/specs_text/brand/interface/form_factor)
      - ordering=created_at|price_min_ksh|price_max_ksh|name (prefix with '-' for desc)
      - page, page_size (if pagination enabled)
    """
    serializer_class = StorageDeviceSerializer
    queryset = StorageDevice.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand", "interface", "form_factor"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get("brand")
        if brand:
            qs = qs.filter(brand__iexact=brand.strip())
        return qs

class StorageDeviceDetailView(generics.RetrieveAPIView):
    """
    GET /api/storages/<int:pk>/
    """
    serializer_class = StorageDeviceSerializer
    queryset = StorageDevice.objects.all()
