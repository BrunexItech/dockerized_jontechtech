// src/Pages/Cart.jsx
import React, { useEffect, useMemo, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Memoized row to avoid re-rendering all items when one changes
const CartItemRow = memo(function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  busy,
}) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow">
      {/* Only product name + price */}
      <div>
        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
        <p className="text-orange-600 font-bold">Ksh {item.product.price}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          onClick={() => onDecrement(item.product.id)}
          disabled={busy || item.quantity <= 0}
          aria-label="Decrease quantity"
          title="Decrease quantity"
        >
          −
        </button>
        <span aria-live="polite" aria-atomic="true">{item.quantity}</span>
        <button
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          onClick={() => onIncrement(item.product.id)}
          disabled={busy}
          aria-label="Increase quantity"
          title="Increase quantity"
        >
          +
        </button>

        <button
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          onClick={() => onRemove(item.product.id)}
          disabled={busy}
        >
          Remove
        </button>
      </div>
    </div>
  );
});

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyMap, setBusyMap] = useState({}); // { [productId]: true }

  // 🔹 Scroll to top when cart mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // helper to broadcast the current total item count to Header
  const broadcastCount = (items) => {
    const count = (items || []).reduce((acc, i) => acc + i.quantity, 0);
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
  };

  const fetchCart = async () => {
    try {
      setInitialLoading(true);
      const data = await api.cart.get();
      setCart(data);
      broadcastCount(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cart]);

  const optimisticUpdate = useCallback((productId, deltaOrRemove) => {
    setCart((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      const idx = items.findIndex((i) => i.product.id === productId);
      if (idx === -1) return prev;

      if (deltaOrRemove === "remove") {
        items.splice(idx, 1);
      } else {
        const nextQty = Math.max(0, items[idx].quantity + deltaOrRemove);
        if (nextQty === 0) {
          items.splice(idx, 1);
        } else {
          items[idx] = { ...items[idx], quantity: nextQty };
        }
      }

      broadcastCount(items);
      return { ...prev, items };
    });
  }, []);

  const withBusy = (productId, fn) => async () => {
    setBusyMap((m) => ({ ...m, [productId]: true }));
    try {
      await fn();
    } catch (err) {
      setError(err.message);
      fetchCart();
    } finally {
      setBusyMap((m) => {
        const copy = { ...m };
        delete copy[productId];
        return copy;
      });
    }
  };

  const increment = (productId) =>
    withBusy(productId, async () => {
      optimisticUpdate(productId, +1);
      await api.cart.increment(productId);
    })();

  const decrement = (productId) =>
    withBusy(productId, async () => {
      optimisticUpdate(productId, -1);
      await api.cart.decrement(productId);
    })();

  const removeItem = (productId) =>
    withBusy(productId, async () => {
      optimisticUpdate(productId, "remove");
      await api.cart.remove(productId);
    })();

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    // 🔹 Scroll to top before navigating
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/checkout");
  };

  if (initialLoading) return <div className="px-6 py-10">Loading cart…</div>;
  if (error) return <div className="px-6 py-10 text-red-600">Error: {error}</div>;
  if (!cart || cart.items.length === 0)
    return <div className="px-6 py-10">Your cart is empty.</div>;

  return (
    <section className="px-6 py-10 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">My Cart</h2>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            busy={!!busyMap[item.product.id]}
            onIncrement={increment}
            onDecrement={decrement}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Total & Checkout */}
      <div className="mt-6 flex justify-between items-center p-4 bg-white rounded-xl shadow">
        <span className="text-xl font-bold">Total: Ksh {total.toFixed(2)}</span>
        <button
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-medium"
          onClick={handleCheckout}
        >
          Checkout
        </button>
      </div>
    </section>
  );
};

export default Cart;
