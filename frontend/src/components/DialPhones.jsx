// src/pages/DialPhones.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

export default function DialPhones() {
  const navigate = useNavigate();

  // data/pagination
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state (keep simple; you can add filters later)
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  // per-card add state
  const [addingMap, setAddingMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setItems([]);
        const data = await api.dialPhones.list({
          search: search || undefined,
          ordering: ordering || undefined,
          page,
          page_size: pageSize,
        });

        const arr = Array.isArray(data) ? data : data?.results || [];
        if (!cancelled) {
          setItems(arr);
          setCount(Array.isArray(data) ? arr.length : data?.count ?? null);
          setNext(Array.isArray(data) ? null : data?.next ?? null);
          setPrevious(Array.isArray(data) ? null : data?.previous ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setCount(null);
          setNext(null);
          setPrevious(null);
          console.error("Failed to load dial phones:", e);
          toast.error(e?.message || "Failed to load dial phones", {
            autoClose: 1500,
            position: "top-center",
          });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [search, ordering, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, ordering]);

  const handleBuyNow = async (item) => {
    if (!item?.product_id) {
      toast.error("This item is not available for purchase yet.", {
        autoClose: 1500,
        position: "top-center",
      });
      return;
    }
    const id = item.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(item.product_id, 1);
      const count = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
      toast.success(`${item.name} added to cart`, {
        autoClose: 1500,
        position: "top-center",
      });
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart", {
        autoClose: 1500,
        position: "top-center",
      });
    } finally {
      setAddingMap((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-2 text-center">Kenyan Dial Phone Deals</h1>
      <p className="text-center text-gray-600 mb-6">Classic dial phones & low-cost feature phones.</p>

      {/* Results summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0 ? "No dial phones found." : count !== null ? `Showing ${items.length} of ${count}` : `Showing ${items.length}`}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {items.map((product) => {
          const isAdding = !!addingMap[product.id];
          const priceText = product.price_display || (product.price_min_ksh ? `${product.price_min_ksh.toLocaleString()} KSh` : "");
          const oldPriceText = product.price_max_ksh ? `${product.price_max_ksh.toLocaleString()} KSh` : null;
          const clickable = !!product.id;

          return (
            <div
              key={product.id}
              className={[
                "relative bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center p-4 group",
                clickable ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              onClick={() => clickable && navigate(`/dialphones/${product.id}`)}
              onKeyDown={(e) => {
                if (!clickable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/dialphones/${product.id}`);
                }
              }}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : -1}
              aria-label={clickable ? `View details for ${product.name}` : undefined}
            >
              {/* Badge */}
              {product.badge && (
                <span
                  className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold shadow-md z-20 ${
                    product.badge.includes("HOT")
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  }`}
                >
                  {product.badge}
                </span>
              )}

              {/* Product Image */}
              <div className="relative w-full flex justify-center z-10">
                <img
                  src={product.image || FallbackImg}
                  alt={product.name}
                  className="w-full h-40 object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = FallbackImg; }}
                />
              </div>

              {/* Product Name */}
              <h3 className="mt-4 text-base font-semibold text-gray-800 text-center">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500">{product.brand}</p>

              {/* Prices */}
              <div className="mt-3 text-center">
                <p className="text-lg font-bold text-green-600">{priceText}</p>
                {oldPriceText && <p className="text-sm text-gray-400 line-through">{oldPriceText}</p>}
              </div>

              {/* Buttons (professional, slimmer; stop propagation so card click doesn't fire) */}
              <div
                className="mt-4 w-full grid grid-cols-2 gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => navigate(`/dialphones/${product.id}`)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                >
                  View Details
                </button>

                <button
                  className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition ${
                    product.product_id
                      ? isAdding
                        ? "bg-blue-600 text-white opacity-70 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => { if (!product.product_id || isAdding) return; handleBuyNow(product); }}
                  disabled={!product.product_id || isAdding}
                  title={product.product_id ? "Add to cart" : "Unavailable"}
                >
                  {isAdding ? "Adding…" : "Buy Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {(previous || next) && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={!previous || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 rounded ${
              previous && page > 1 ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            disabled={!next}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded ${next ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
