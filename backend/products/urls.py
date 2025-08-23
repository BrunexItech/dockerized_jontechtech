from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    CartView,
    AddToCartView,
    RemoveFromCartView,
    CheckoutValidateView,
    CheckoutCreateView,
    OrderDetailView,
    OrderReceiptStatusView,
    OrderReceiptDownloadView,
    OrderReceiptEmailView,
)

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),

    # CART
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/add/", AddToCartView.as_view(), name="add-to-cart"),
    path("cart/remove/", RemoveFromCartView.as_view(), name="remove-from-cart"),

    # CHECKOUT
    path("checkout/validate/", CheckoutValidateView.as_view(), name="checkout-validate"),
    path("checkout/", CheckoutCreateView.as_view(), name="checkout-create"),

    # ORDERS
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<int:pk>/receipt/", OrderReceiptStatusView.as_view(), name="order-receipt-status"),
    path("orders/<int:pk>/receipt/download/", OrderReceiptDownloadView.as_view(), name="order-receipt-download"),
    path("orders/<int:pk>/email-receipt/", OrderReceiptEmailView.as_view(), name="order-email-receipt"),
]
