from django.urls import path
from .views import StorageDeviceListView, StorageDeviceDetailView

urlpatterns = [
    path("storages/", StorageDeviceListView.as_view(), name="storage-list"),
    path("storages/<int:pk>/", StorageDeviceDetailView.as_view(), name="storage-detail"),
]
