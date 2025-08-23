import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

// Align options with MkopaItem.Brand/Category
const BRAND_OPTIONS = ["All", "Samsung", "M-KOPA", "Nokia", "Tecno", "Infinix", "itel", "Unbranded"];
const CATEGORY_OPTIONS = ["All", "Smartphones", "Feature Phones", "Others"];

export default function Mkopa() {
  const navigate = useNavigate();

  // data/pagination
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state
  const [brand, setBrand] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // per-card add state
  const [addingMap, setAddingMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setItems([]);
        const data = await api.mkopa.list({
          brand: brand !== "All" ? brand : undefined,
          category: category !== "All" ? category : undefined,
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
          setItems([]); setCount(null); setNext(null); setPrevious(null);
          console.error("Failed to load M-KOPA items:", e);
          toast.error(e?.message || "Failed to load M-KOPA items");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [brand, category, search, ordering, page, pageSize]);

  // Group by category for sectioning (like Audio)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = it.category_display || it.category || "Others";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return map;
  }, [items]);

  const sectionCategories = useMemo(() => {
    if (category === "All") return Array.from(grouped.keys());
    return grouped.has(category) ? [category] : [];
  }, [category, grouped]);

  useEffect(() => { setPage(1); }, [brand, category, search, ordering]);

  const handleBuyNow = async (offer) => {
    if (!offer?.product_id) {
      toast.error("This item is not available for purchase yet.");
      return;
    }
    const id = offer.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(offer.product_id, 1);
      const count = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
      toast.success(`${offer.name} added to cart`);
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart");
    } finally {
      setAddingMap((m) => { const copy = { ...m }; delete copy[id]; return copy; });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-2 text-center">M‑KOPA Phones in Kenya (2025)</h1>
      <p className="text-center text-gray-600 mb-6">
        Small deposit today. Easy weekly payments. Take it home now.
      </p>

      {/* Filters Row */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        {/* Brand */}
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border rounded px-3 py-2">
          {BRAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name/specs/brand…"
          className="border rounded px-3 py-2 w-72"
        />

        {/* Ordering */}
        <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Default order</option>
          <option value="created_at">Created (oldest first)</option>
          <option value="-created_at">Created (newest first)</option>
          <option value="price_min_ksh">Price (low first)</option>
          <option value="-price_min_ksh">Price (high first)</option>
          <option value="weekly_ksh">Weekly (low first)</option>
          <option value="-weekly_ksh">Weekly (high first)</option>
          <option value="deposit_ksh">Deposit (low first)</option>
          <option value="-deposit_ksh">Deposit (high first)</option>
          <option value="name">Name (A→Z)</option>
          <option value="-name">Name (Z→A)</option>
        </select>
      </div>

      {/* Category pills (same UI as Audio) */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORY_OPTIONS.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={
                  `px-3 py-1.5 rounded-full text-sm transition ` +
                  (active
                    ? "bg-green-600 text-white shadow"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800")
                }
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0 ? "No M‑KOPA items found." : count !== null ? `Showing ${items.length} of ${count}` : `Showing ${items.length}`}
      </div>

      {/* Category Sections */}
      {sectionCategories.map((cat) => (
        <section key={cat} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">{cat}</h2>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {grouped.get(cat)?.map((o) => {
              const isAdding = !!addingMap[o.id];
              return (
                <div
                  key={o.id}
                  className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <div className="h-56 w-full overflow-hidden rounded-t-2xl bg-white flex items-center justify-center">
                      <img
                        src={o.image || FallbackImg}
                        alt={o.name}
                        className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FallbackImg; }}
                      />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold leading-snug mb-1 line-clamp-2">{o.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {o.specs_text || `${o.brand_display} • ${o.category_display}`}
                    </p>

                    <div className="text-green-700 font-bold text-base mb-1">Deposit: KSh {o.deposit_ksh?.toLocaleString?.() || o.deposit_ksh}</div>
                    <div className="text-gray-800 text-sm mb-4">Weekly: KSh {o.weekly_ksh?.toLocaleString?.() || o.weekly_ksh} • {o.term_weeks} weeks</div>

                    <div className="text-blue-600 font-bold text-base mb-4">{o.price_display}</div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        className="inline-flex items-center justify-center rounded-xl border bg-white hover:bg-gray-50 text-gray-900 py-2 px-3 transition"
                        onClick={() => navigate(`/mkopa/${o.id}`)}
                      >
                        View Details
                      </button>

                      <button
                        className={`inline-flex items-center justify-center rounded-xl py-2 px-3 transition ${
                          o.product_id
                            ? isAdding
                              ? "bg-green-600 text-white opacity-70 cursor-wait"
                              : "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={() => { if (!o.product_id || isAdding) return; handleBuyNow(o); }}
                        disabled={!o.product_id || isAdding}
                        title={o.product_id ? "Add to cart" : "Unavailable"}
                      >
                        {isAdding ? "Adding…" : "Buy Now"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

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
