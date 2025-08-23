# smartphones/urls.py
from django.urls import path
from .views import SmartphoneListView, SmartphoneDetailView

urlpatterns = [
    path("smartphones/", SmartphoneListView.as_view(), name="smartphone-list"),
    path("smartphones/<int:pk>/", SmartphoneDetailView.as_view(), name="smartphone-detail"),
]
