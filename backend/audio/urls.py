from django.urls import path
from .views import AudioDeviceListView, AudioDeviceDetailView

urlpatterns = [
    path("audio-devices/", AudioDeviceListView.as_view(), name="audio-device-list"),
    path("audio-devices/<int:pk>/", AudioDeviceDetailView.as_view(), name="audio-device-detail"),
]
