from django.urls import path
from .views import TelevisionListView, TelevisionDetailView

urlpatterns = [
    path("televisions/", TelevisionListView.as_view(), name="television-list"),
    path("televisions/<int:pk>/", TelevisionDetailView.as_view(), name="television-detail"),
]
