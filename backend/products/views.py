# products/views.py

from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal
from django.http import FileResponse
from django.utils import timezone
import logging

from .models import Product, Cart, CartItem, Order, OrderItem
from .serializers import ProductSerializer, CartSerializer, CartItemSerializer, OrderSerializer
from .receipts import ensure_receipt_pdf, send_receipt_email

logger = logging.getLogger(__name__)


# ------------------ PRODUCTS ------------------

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


# ------------------ CART ------------------

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Get or create a cart for the logged-in user.
        """
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Add (or increment/decrement) a product for the logged-in user's cart.
        Supports positive and negative deltas.
        If resulting quantity <= 0, remove the item (can't go below 0).
        """
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get("product_id")
        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        if not product_id:
            return Response({"detail": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if quantity == 0:
            return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

        product = get_object_or_404(Product, id=product_id)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, defaults={"quantity": max(1, quantity)}
        )

        if not created:
            new_qty = cart_item.quantity + quantity
            if new_qty <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = new_qty
                cart_item.save(update_fields=["quantity"])

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class RemoveFromCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Remove a product from the logged-in user's cart.
        """
        cart = get_object_or_404(Cart, user=request.user)
        product_id = request.data.get("product_id")

        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        cart_item.delete()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


# ------------------ CHECKOUT ------------------

def _prepare_items_and_subtotal(cart):
    """
    Build line items and compute subtotal.
    (Add stock checks here later if needed.)
    """
    if not cart.items.exists():
        return None, Decimal("0.00"), "Cart is empty."

    items = []
    subtotal = Decimal("0.00")
    for ci in cart.items.select_related("product").all():
        p = ci.product
        qty = int(ci.quantity)
        if qty <= 0:
            return None, Decimal("0.00"), f"Invalid quantity for {p.name}"
        price = Decimal(p.price)
        line_total = price * qty
        subtotal += line_total
        items.append({
            "product": p,
            "name": p.name,
            "unit_price": price,
            "quantity": qty,
            "line_total": line_total,
        })
    return items, subtotal, None


def _normalize_shipping(shipping):
    def g(*keys):
        for k in keys:
            v = shipping.get(k)
            if isinstance(v, str) and v.strip() != "":
                return v.strip()
            if v and not isinstance(v, str):
                return str(v)
        return ""
    return {
        "full_name": g("full_name", "fullName", "name"),
        "phone": g("phone", "phoneNumber"),
        "address1": g("address1", "addressLine1"),
        "address2": g("address2", "addressLine2"),
        "city": g("city"),
        "country": g("country"),
    }


def _normalize_billing(billing):
    def g(*keys):
        for k in keys:
            v = billing.get(k)
            if isinstance(v, str) and v.strip() != "":
                return v.strip()
            if v and not isinstance(v, str):
                return str(v)
        return ""
    return {
        "name_on_card": g("name_on_card", "nameOnCard"),
        "tax_id": g("tax_id", "taxId"),
    }


class CheckoutValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items, subtotal, err = _prepare_items_and_subtotal(cart)
        if err:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)
        shipping_fee = Decimal("0.00")
        total = subtotal + shipping_fee
        return Response({
            "ok": True,
            "totals": {
                "subtotal": f"{subtotal:.2f}",
                "shipping_fee": f"{shipping_fee:.2f}",
                "total": f"{total:.2f}",
            }
        })


class CheckoutCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        payload = request.data or {}
        shipping_in = payload.get("shipping") or {}
        billing_in = payload.get("billing") or {}
        shipping = _normalize_shipping(shipping_in)
        billing = _normalize_billing(billing_in)
        payment_method = payload.get("payment_method") or Order.PAYMENT_COD

        # Validate shipping fields
        for field in ("full_name", "phone", "address1", "city", "country"):
            if not shipping.get(field):
                return Response({"detail": f"Missing shipping field: {field}"}, status=400)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        items, subtotal, err = _prepare_items_and_subtotal(cart)
        if err:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

        shipping_fee = Decimal("0.00")
        total = subtotal + shipping_fee

        order = Order.objects.create(
            user=request.user,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total=total,
            payment_method=payment_method,
            status=Order.STATUS_PENDING,
            ship_full_name=shipping["full_name"],
            ship_phone=shipping["phone"],
            ship_address1=shipping["address1"],
            ship_address2=shipping.get("address2") or "",
            ship_city=shipping["city"],
            ship_country=shipping["country"],
            bill_name_on_card=billing.get("name_on_card") or "",
            bill_tax_id=billing.get("tax_id") or "",
        )

        for it in items:
            OrderItem.objects.create(
                order=order,
                product=it["product"],
                name=it["name"],
                unit_price=it["unit_price"],
                quantity=it["quantity"],
                line_total=it["line_total"],
            )

        # clear cart
        cart.items.all().delete()

        # Generate receipt + email (best-effort; don't block success)
        try:
            if not order.receipt_number:
                order.receipt_number = f"R-{timezone.now():%Y}-{order.id:06d}"
                order.save(update_fields=["receipt_number"])

            ensure_receipt_pdf(order)

            user_email = (getattr(request.user, "email", "") or "").strip()
            if user_email:
                send_receipt_email(order, user_email)
                logger.info(
                    "Receipt email queued/sent for order %s to %s (user_id=%s).",
                    order.id, user_email, request.user.id
                )
            else:
                logger.info(
                    "Order %s placed but user has no email set; skipping email. (user_id=%s)",
                    order.id, request.user.id
                )
        except Exception as e:
            logger.exception(
                "Receipt generation/email failed for order %s (user_id=%s): %s",
                order.id, request.user.id, e
            )

        return Response({"id": order.id, "status": order.status, "total": f"{order.total:.2f}"})


# ------------------ ORDERS ------------------

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items").get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        data = OrderSerializer(order, context={"request": request}).data
        return Response(data)


class OrderReceiptStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        ready = bool(order.receipt_pdf)
        download_url = None
        if ready:
            download_url = request.build_absolute_uri(f"/api/orders/{order.id}/receipt/download/")
        return Response({"ready": ready, "download_url": download_url})


class OrderReceiptDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        if not order.receipt_pdf:
            return Response({"detail": "Receipt not ready."}, status=404)

        # Stream file (Django will close the file when the response is closed)
        f = order.receipt_pdf.open("rb")
        response = FileResponse(f, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{order.receipt_pdf.name.split("/")[-1]}"'
        return response


class OrderReceiptEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

        user_email = (getattr(request.user, "email", "") or "").strip()
        if not user_email:
            return Response({"detail": "Your account has no email address."}, status=400)

        try:
            ensure_receipt_pdf(order)
            send_receipt_email(order, user_email)
            logger.info(
                "Resent receipt for order %s to %s (user_id=%s).",
                order.id, user_email, request.user.id
            )
        except Exception as e:
            logger.exception(
                "Resend receipt failed for order %s (user_id=%s): %s",
                order.id, request.user.id, e
            )
            return Response({"detail": "Failed to send receipt."}, status=500)

        return Response({"ok": True})
