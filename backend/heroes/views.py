# heroes/views.py
from rest_framework import generics
from .models import Hero
from .serializers import HeroSerializer

class HeroListAPIView(generics.ListAPIView):
    """
    Returns all uploaded images (hero and product).
    The frontend will filter by `category` ("hero" or "product").
    """
    queryset = Hero.objects.all()
    serializer_class = HeroSerializer
