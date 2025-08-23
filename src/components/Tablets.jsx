import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";
const BRAND_OPTIONS = ["All", "Samsung", "Apple", "Lenovo", "Huawei", "Tablets for Kids", "Others"];

export default function Tablets() {
  const navigate = useNavigate();

  // Data + pagination
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState(""); // e.g. "-created_at"
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Track per-card add-to-cart busy state
  const [addingMap, setAddingMap] = useState({}); // { [tabletId]: true }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setItems([]);
        const data = await api.tablets.list({
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
          console.error("Failed to load tablets:", e);
          toast.error(e?.message || "Failed to load tablets");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, search, ordering, page, pageSize]);

  // Group by brand for display sections
  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of items) {
      const key = t.brand_display || t.brand || "Others";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return map;
  }, [items]);

  const sectionBrands = useMemo(() => {
    if (filter === "All") return Array.from(grouped.keys());
    return grouped.has(filter) ? [filter] : [];
  }, [filter, grouped]);

  // Reset page when changing filters
  useEffect(() => {
    setPage(1);
  }, [filter, search, ordering]);

  // Add to cart from list (Buy Now behavior)
  const handleBuyNow = async (tablet) => {
    if (!tablet?.product_id) {
      toast.error("This tablet is not available for purchase yet.");
      return;
    }
    const tid = tablet.id;
    setAddingMap((m) => ({ ...m, [tid]: true }));
    try {
      const updated = await api.cart.add(tablet.product_id, 1);
      const count = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
      toast.success(`${tablet.name} added to cart`);
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart");
    } finally {
      setAddingMap((m) => {
        const copy = { ...m };
        delete copy[tid];
        return copy;
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Top Tablets in Kenya (2025)</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {BRAND_OPTIONS.map((b) => (
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

      {/* Results summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0 ? "No tablets found." : count !== null ? `Showing ${items.length} of ${count}` : `Showing ${items.length}`}
      </div>

      {/* Sections */}
      {sectionBrands.map((brand) => (
        <section key={brand} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">{brand}</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {grouped.get(brand)?.map((t) => {
              const isAdding = !!addingMap[t.id];
              return (
                <div
                  key={t.id}
                  className="flex flex-col border rounded-lg shadow hover:shadow-lg transition bg-white"
                >
                  <div className="h-48 w-full rounded-t-lg flex items-center justify-center bg-white">
                    <img
                      src={t.image || FallbackImg}
                      alt={t.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FallbackImg;
                      }}
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold mb-1">{t.name}</h3>
                    <p className="text-gray-700 mb-2">
                      {t.specs_text ||
                        [
                          t.ram_gb ? `${t.ram_gb}GB RAM` : null,
                          t.storage_gb ? `${t.storage_gb}GB Storage` : null,
                          t.display_inches ? `${t.display_inches}" ${t.display_type || ""}`.trim() : null,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "—"}
                    </p>
                    <p className="text-blue-600 font-bold mb-4">
                      {t.price_display ||
                        (t.price_max_ksh
                          ? `${t.price_min_ksh} – ${t.price_max_ksh} KSh`
                          : `${t.price_min_ksh} KSh`)}
                    </p>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded transition"
                        onClick={() => navigate(`/tablet/${t.id}`)}
                      >
                        View Details
                      </button>

                      {/* BUY NOW -> Add to Cart (using linked Product PK) */}
                      <button
                        className={`py-2 rounded transition ${
                          t.product_id
                            ? isAdding
                              ? "bg-blue-600 text-white opacity-70 cursor-wait"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (!t.product_id || isAdding) return;
                          handleBuyNow(t);
                        }}
                        disabled={!t.product_id || isAdding}
                        title={t.product_id ? "Add to cart" : "Unavailable"}
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
