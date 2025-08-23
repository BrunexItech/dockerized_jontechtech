from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NewIphone, NewIphoneBanner
from .serializers import NewIphoneSerializer, NewIphoneBannerSerializer

class NewIphoneListView(generics.ListAPIView):
    serializer_class = NewIphoneSerializer
    queryset = NewIphone.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "specs_text"]
    ordering_fields = ["created_at", "new_price_ksh", "old_price_ksh", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        badge = self.request.query_params.get("badge")
        if badge:
            qs = qs.filter(badge__iexact=badge.strip())
        return qs


class NewIphoneDetailView(generics.RetrieveAPIView):
    serializer_class = NewIphoneSerializer
    queryset = NewIphone.objects.all()


class NewIphoneBannerView(APIView):
    """
    Return the single global banner (the first entry). If none exists return 204 No Content.
    """
    def get(self, request, *args, **kwargs):
        banner = NewIphoneBanner.objects.first()
        if not banner:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = NewIphoneBannerSerializer(banner, context={"request": request})
        return Response(serializer.data)
