from rest_framework import generics, filters
from .models import Television
from .serializers import TelevisionSerializer

class TelevisionListView(generics.ListAPIView):
    """
    GET /api/televisions/
    Optional query params:
      - brand=Samsung|LG|Sony|Hisense|Vitron|TCL|Unbranded
      - min_size=32
      - max_size=85
      - panel=LED|QLED|OLED|NanoCell|Crystal|Other
      - resolution=HD|FHD|UHD|8K
      - search=<text>   (searches name/specs_text/brand/panel/resolution)
      - ordering=created_at|price_min_ksh|price_max_ksh|screen_size_inches|name (prefix with '-' for desc)
    """
    serializer_class = TelevisionSerializer
    queryset = Television.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text", "brand", "panel", "resolution"]
    ordering_fields = ["created_at", "price_min_ksh", "price_max_ksh", "screen_size_inches", "name"]
    ordering = ["brand", "screen_size_inches", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        brand = params.get("brand")
        panel = params.get("panel")
        resolution = params.get("resolution")
        min_size = params.get("min_size")
        max_size = params.get("max_size")

        if brand:
            qs = qs.filter(brand__iexact=brand.strip())
        if panel:
            qs = qs.filter(panel__iexact=panel.strip())
        if resolution:
            # allow "UHD" for 4K shortcut
            if resolution.upper() == "4K":
                qs = qs.filter(resolution__iexact="UHD")
            else:
                qs = qs.filter(resolution__iexact=resolution.strip())

        try:
            if min_size:
                qs = qs.filter(screen_size_inches__gte=int(min_size))
            if max_size:
                qs = qs.filter(screen_size_inches__lte=int(max_size))
        except (TypeError, ValueError):
            pass

        return qs

class TelevisionDetailView(generics.RetrieveAPIView):
    """
    GET /api/televisions/<int:pk>/
    """
    serializer_class = TelevisionSerializer
    queryset = Television.objects.all()
