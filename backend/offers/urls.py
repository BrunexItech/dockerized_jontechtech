from django.urls import path
from .views import LatestOfferListView, LatestOfferDetailView

urlpatterns = [
    path("latest-offers/", LatestOfferListView.as_view(), name="latest-offer-list"),
    path("latest-offers/<int:pk>/", LatestOfferDetailView.as_view(), name="latest-offer-detail"),
]
