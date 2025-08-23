# heroes/urls.py
from django.urls import path
from .views import HeroListAPIView

urlpatterns = [
    path("heroes/", HeroListAPIView.as_view(), name="hero-list"),
]
