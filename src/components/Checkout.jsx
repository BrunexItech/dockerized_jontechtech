// src/Pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const emptyShipping = {
  full_name: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  country: "Kenya",
};

const emptyBilling = {
  name_on_card: "",
  tax_id: "",
};

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [shipping, setShipping] = useState(emptyShipping);
  const [billing, setBilling] = useState(emptyBilling);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod | mpesa | card

  useEffect(() => {
    (async () => {
      try {
        const c = await api.cart.get();
        if (!c?.items?.length) {
          navigate("/cart");
          return;
        }
        setCart(c);
      } catch (e) {
        setError(e.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [cart]);

  const onChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // --- Normalizers ensure backend gets snake_case keys it expects
  const normalizeShipping = (s) => ({
    full_name: (s.full_name ?? s.fullName ?? "").trim(),
    phone: (s.phone ?? s.phoneNumber ?? "").trim(),
    address1: (s.address1 ?? s.addressLine1 ?? "").trim(),
    address2: (s.address2 ?? s.addressLine2 ?? "").trim(),
    city: (s.city ?? "").trim(),
    country: (s.country ?? "").trim(),
  });

  const normalizeBilling = (b) => ({
    name_on_card: (b.name_on_card ?? b.nameOnCard ?? "").trim(),
    tax_id: (b.tax_id ?? b.taxId ?? "").trim(),
  });

  const validateForm = (s, b) => {
    if (!s.full_name || !s.phone || !s.address1 || !s.city || !s.country) {
      setError("Please complete your shipping details.");
      return false;
    }
    if (paymentMethod === "card" && !b.name_on_card) {
      setError("Please enter the name on card for card payments.");
      return false;
    }
    setError("");
    return true;
  };

  const placeOrder = async () => {
    if (placing) return;

    // Normalize before validation/sending
    const s = normalizeShipping(shipping);
    const b = normalizeBilling(billing);

    if (!validateForm(s, b)) return;

    setPlacing(true);
    try {
      // Validate cart (stock/price) on server
      await api.checkout.validate();

      // Create order
      const order = await api.checkout.create({
        shipping: s,
        billing: b,
        payment_method: paymentMethod,
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch (e) {
      setError(e.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="px-6 py-10">Loading checkout…</div>;

  return (
    <section className="px-6 py-10 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {error && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border p-2 rounded" placeholder="Full Name*" name="full_name" value={shipping.full_name} onChange={onChange(setShipping)} required />
              <input className="border p-2 rounded" placeholder="Phone*" name="phone" value={shipping.phone} onChange={onChange(setShipping)} required />
              <input className="border p-2 rounded md:col-span-2" placeholder="Address Line 1*" name="address1" value={shipping.address1} onChange={onChange(setShipping)} required />
              <input className="border p-2 rounded md:col-span-2" placeholder="Address Line 2" name="address2" value={shipping.address2} onChange={onChange(setShipping)} />
              <input className="border p-2 rounded" placeholder="City*" name="city" value={shipping.city} onChange={onChange(setShipping)} required />
              <input className="border p-2 rounded" placeholder="Country*" name="country" value={shipping.country} onChange={onChange(setShipping)} required />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">Payment</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="pm" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                <span>Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="pm" checked={paymentMethod === "mpesa"} onChange={() => setPaymentMethod("mpesa")} />
                <span>Mpesa (integrate later)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="pm" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
                <span>Card (Stripe/Flutterwave later)</span>
              </label>
            </div>

            {paymentMethod === "card" && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border p-2 rounded md:col-span-2" placeholder="Name on Card*" name="name_on_card" value={billing.name_on_card} onChange={onChange(setBilling)} required />
                <input className="border p-2 rounded" placeholder="Tax ID (optional)" name="tax_id" value={billing.tax_id} onChange={onChange(setBilling)} />
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="bg-white rounded-xl shadow p-4 h-max">
          <h2 className="font-semibold text-lg mb-3">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {cart.items.map((i) => (
              <div key={i.product.id} className="flex justify-between text-sm">
                <span>{i.product.name} × {i.quantity}</span>
                <span>Ksh {(i.product.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>Ksh {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-medium disabled:opacity-50"
            onClick={placeOrder}
            disabled={placing}
          >
            {placing ? "Placing order…" : "Place Order"}
          </button>
        </aside>
      </div>
    </section>
  );
}
