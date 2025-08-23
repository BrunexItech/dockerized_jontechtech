from django.urls import path
from .views import RealLaptopListView, RealLaptopDetailView

urlpatterns = [
    path("reallaptops/", RealLaptopListView.as_view(), name="reallaptop-list"),
    path("reallaptops/<int:pk>/", RealLaptopDetailView.as_view(), name="reallaptop-detail"),
]
