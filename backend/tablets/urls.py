# tablets/urls.py
from django.urls import path
from .views import TabletListView, TabletDetailView

urlpatterns = [
    path("tablets/", TabletListView.as_view(), name="tablet-list"),
    path("tablets/<int:pk>/", TabletDetailView.as_view(), name="tablet-detail"),
]
