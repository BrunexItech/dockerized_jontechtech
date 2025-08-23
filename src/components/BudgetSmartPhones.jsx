import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

const BRAND_OPTIONS = ["All", "Xiaomi", "Infinix", "Samsung", "Tecno", "Itel", "Realme", "Nokia", "Vivo", "Oppo", "Villaon", "Unbranded"];
const BADGE_OPTIONS = ["All", "OPEN", "OPEN HOT"];

const skeleton = new Array(10).fill(0);

export default function BudgetSmartphoneDeals() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  const [brand, setBrand] = useState("All");
  const [badge, setBadge] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [addingMap, setAddingMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setItems([]);
        const data = await api.budgetSmartphones.list({
          brand: brand !== "All" ? brand : undefined,
          badge: badge !== "All" ? badge : undefined,
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
          console.error("Failed to load budget smartphones:", e);
          toast.error(e?.message || "Failed to load budget smartphones");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [brand, badge, search, ordering, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [brand, badge, search, ordering]);

  const handleBuyNow = async (phone) => {
    if (!phone?.product_id) {
      toast.error("This item is not available for purchase yet.");
      return;
    }
    const id = phone.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(phone.product_id, 1);
      const cnt = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: cnt } }));
      toast.success(`${phone.name} added to cart`);
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart");
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
      {/* Title */}
      <h2 className="text-lg font-bold mb-6 text-gray-800 text-center">Budget Smartphone Deals</h2>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border rounded px-3 py-2">
          {BRAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={badge} onChange={(e) => setBadge(e.target.value)} className="border rounded px-3 py-2">
          {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search phone/model/brand…"
          className="border rounded px-3 py-2 w-72"
        />

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Default order</option>
          <option value="created_at">Created (oldest first)</option>
          <option value="-created_at">Created (newest first)</option>
          <option value="price_min_ksh">Price (low first)</option>
          <option value="-price_min_ksh">Price (high first)</option>
          <option value="name">Name (A→Z)</option>
          <option value="-name">Name (Z→A)</option>
        </select>
      </div>

      {/* Summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0 ? "No budget smartphones found." : count !== null ? `Showing ${items.length} of ${count}` : `Showing ${items.length}`}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {(items.length ? items : skeleton).map((p, idx) => {
          const k = p?.id ?? `s-${idx}`;
          const isAdding = !!addingMap[p?.id];

          // Keep your original card styles
          return (
            <div
              key={k}
              className="relative border border-gray-300 rounded-lg p-3 pt-8 flex flex-col items-center group shadow-sm hover:shadow-lg hover:border-blue-500 transition-all duration-300 ease-in-out transform hover:-translate-y-2 bg-white"
            >
              {/* Badge */}
              {p?.badge && (
                <span
                  className={`absolute top-2 left-2 z-10 ${
                    p.badge.includes("HOT") ? "bg-gradient-to-r from-blue-500 to-blue-700" : "bg-gradient-to-r from-red-500 to-red-700"
                  } text-white text-xs font-bold px-2 py-1 rounded-full shadow-md`}
                >
                  {p.badge}
                </span>
              )}

              {/* Image */}
              <div className="relative w-full overflow-hidden rounded-lg">
                {p ? (
                  <img
                    src={p.image || FallbackImg}
                    alt={p.name}
                    className="w-full h-40 object-contain transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = FallbackImg; }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 animate-pulse rounded-lg" />
                )}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full" />
              </div>

              {/* Name & brand */}
              <h3 className="mt-3 text-sm font-semibold text-center text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                {p?.name || "—"}
              </h3>
              <p className="text-xs text-gray-500">{p?.brand_display || p?.brand || "—"}</p>

              {/* Prices */}
              <div className="mt-2 text-center">
                <p className="text-red-500 font-bold">{p?.price_display || "—"}</p>
                {p?.price_max_ksh ? (
                  <p className="text-gray-400 text-sm line-through">
                    {`${p.price_max_ksh.toLocaleString()} KSh`}
                  </p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                <button
                  className="inline-flex items-center justify-center rounded-md border bg-white hover:bg-gray-50 text-gray-900 py-1.5 px-2 text-sm transition"
                  onClick={() => p?.id && navigate(`/budget-smartphones/${p.id}`)}
                  disabled={!p?.id}
                  title="View Details"
                >
                  View Details
                </button>

                <button
                  className={`inline-flex items-center justify-center rounded-md py-1.5 px-2 text-sm transition ${
                    p?.product_id
                      ? isAdding
                        ? "bg-blue-600 text-white opacity-70 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (!p?.product_id || isAdding) return;
                    handleBuyNow(p);
                  }}
                  disabled={!p?.product_id || isAdding}
                  title={p?.product_id ? "Add to cart" : "Unavailable"}
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
