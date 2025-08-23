from django.urls import path
from .views import MobileAccessoryListView, MobileAccessoryDetailView

urlpatterns = [
    path("mobile-accessories/", MobileAccessoryListView.as_view(), name="mobile-accessory-list"),
    path("mobile-accessories/<int:pk>/", MobileAccessoryDetailView.as_view(), name="mobile-accessory-detail"),
]
