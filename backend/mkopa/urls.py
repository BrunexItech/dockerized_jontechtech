from django.urls import path
from .views import MkopaItemListView, MkopaItemDetailView

urlpatterns = [
    path("mkopa-items/", MkopaItemListView.as_view(), name="mkopa-item-list"),
    path("mkopa-items/<int:pk>/", MkopaItemDetailView.as_view(), name="mkopa-item-detail"),
]
