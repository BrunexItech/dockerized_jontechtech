from django.urls import path
from .views import BudgetSmartphoneListView, BudgetSmartphoneDetailView

urlpatterns = [
    path("budget-smartphones/", BudgetSmartphoneListView.as_view(), name="budget-smartphone-list"),
    path("budget-smartphones/<int:pk>/", BudgetSmartphoneDetailView.as_view(), name="budget-smartphone-detail"),
]
