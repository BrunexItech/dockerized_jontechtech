# dialphones/urls.py
from django.urls import path
from .views import DialPhoneDealListView, DialPhoneDealDetailView

urlpatterns = [
    path("dial-phones/", DialPhoneDealListView.as_view(), name="dial-phone-list"),
    path("dial-phones/<int:pk>/", DialPhoneDealDetailView.as_view(), name="dial-phone-detail"),
]
