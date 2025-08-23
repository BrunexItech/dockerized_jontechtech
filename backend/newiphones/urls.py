from django.urls import path
from .views import NewIphoneListView, NewIphoneDetailView, NewIphoneBannerView

urlpatterns = [
    path("new-iphones/", NewIphoneListView.as_view(), name="new-iphone-list"),
    path("new-iphones/<int:pk>/", NewIphoneDetailView.as_view(), name="new-iphone-detail"),
    path("new-iphones-banner/", NewIphoneBannerView.as_view(), name="new-iphone-banner"),
]
