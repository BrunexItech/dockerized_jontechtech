// src/pages/Reallaptops.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

export default function Reallaptops() {
  const navigate = useNavigate();

  // Data + pagination (unchanged)
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state (unchanged)
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Track per-card add-to-cart busy state (unchanged)
  const [addingMap, setAddingMap] = useState({}); // { [id]: true }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setItems([]);
        const data = await api.reallaptops.list({
          brand: filter !== "All" ? filter : undefined,
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
          console.error("Failed to load reallaptops:", e);
          toast.error(e?.message || "Failed to load laptops");
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filter, search, ordering, page, pageSize]);

  // Group by brand for display sections (unchanged)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of items) {
      const key = (t.brand || "Others").trim() || "Others";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return map;
  }, [items]);

  // Dynamic brand options from current page (unchanged)
  const brandOptions = useMemo(() => {
    const arr = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
    return ["All", ...arr];
  }, [grouped]);

  const sectionBrands = useMemo(() => {
    if (filter === "All") return Array.from(grouped.keys());
    return grouped.has(filter) ? [filter] : [];
  }, [filter, grouped]);

  // Reset page when changing filters (unchanged)
  useEffect(() => { setPage(1); }, [filter, search, ordering]);

  // Add to cart from list (Buy Now behavior) — unchanged logic
  const handleBuyNow = async (item) => {
    if (!item?.product_id) {
      toast.error("This laptop is not available for purchase yet.");
      return;
    }
    const id = item.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(item.product_id, 1);
      const count = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
      toast.success(`${item.name} added to cart`);
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

  // ------- Card UI (STYLING ONLY copied from Laptops.jsx) -------
  const Card = ({ t, isAdding }) => {
    const currentImage = t.image || FallbackImg;
    const price = t.price_display ||
      (t.price_max_ksh ? `${t.price_min_ksh} – ${t.price_max_ksh} KSh` : `${t.price_min_ksh} KSh`);
    const oldPrice = t.price_max_ksh ? `${t.price_max_ksh} KSh` : null;
    const discount = t.discount || ""; // will show only if you add this field later

    return (
      <div className="group relative bg-white rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl">
        {discount && (
          <span className="absolute top-2 left-2 z-10 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            {discount}
          </span>
        )}

        {/* Product Image */}
        <div className="relative overflow-hidden">
          <Link to={`/reallaptop/${t.id}`} className="block">
            <img
              src={currentImage}
              alt={t.name}
              className="w-full h-56 object-cover transform transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { e.currentTarget.src = FallbackImg; }}
            />
          </Link>
        </div>

        {/* Hover Buttons BELOW image */}
        <div className="h-0 overflow-hidden group-hover:h-20 transition-all duration-300 bg-white border-t border-gray-200 flex items-center justify-center gap-3 px-4">
          {/* Quick View */}
          <Link
            to={`/reallaptop/${t.id}`}
            className="flex-1 bg-orange-600 text-white text-center py-2 rounded-lg shadow-md hover:bg-orange-700 hover:scale-105 transform transition text-sm font-medium"
          >
            QUICK VIEW
          </Link>

          {/* Add to Cart using linked Product PK (logic intact) */}
          <button
            onClick={() => {
              if (!t.product_id || isAdding) return;
              handleBuyNow(t);
            }}
            disabled={!t.product_id || isAdding}
            className="flex-1 bg-orange-600 text-white py-2 rounded-lg shadow-md hover:bg-orange-700 hover:scale-105 transform transition text-sm font-medium disabled:opacity-60 disabled:hover:scale-100"
            title={t.product_id ? "Add to cart" : "Unavailable"}
          >
            {isAdding ? "Adding…" : "Add to Cart"}
          </button>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mt-1">{t.name}</h3>
          <p className="text-gray-600 text-sm">{t.brand || ""}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-orange-600 font-bold">{price}</span>
            {oldPrice && <span className="text-gray-400 line-through text-sm">{oldPrice}</span>}
          </div>
        </div>
      </div>
    );
  };
  // ---------------------------------------------------------------

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Top Laptops in Kenya (2025)</h1>

      {/* Filters (unchanged) */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {brandOptions.map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className={`py-2 px-4 rounded shadow ${
              filter === b ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name/specs/brand…"
          className="border rounded px-3 py-2 w-72"
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Default order</option>
          <option value="created_at">Created (oldest first)</option>
          <option value="-created_at">Created (newest first)</option>
          <option value="price_min_ksh">Price (low first)</option>
          <option value="-price_min_ksh">Price (high first)</option>
          <option value="name">Name (A→Z)</option>
          <option value="-name">Name (Z→A)</option>
        </select>
      </div>

      {/* Results summary (unchanged) */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0 ? "No laptops found." : count !== null ? `Showing ${items.length} of ${count}` : `Showing ${items.length}`}
      </div>

      {/* Sections (logic unchanged, styling applied inside <Card />) */}
      {sectionBrands.map((brand) => (
        <section key={brand} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">{brand}</h2>

          {/* Grid matches your example: 1 / 2 / 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {grouped.get(brand)?.map((t) => {
              const isAdding = !!addingMap[t.id];
              return <Card key={t.id} t={t} isAdding={isAdding} />;
            })}
          </div>
        </section>
      ))}

      {/* Pagination (unchanged) */}
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
