// src/components/Smartphones.jsx (or src/pages/Smartphones.jsx)
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";
const BRAND_OPTIONS = ["All", "Samsung", "Apple", "Tecno", "Infinix", "Xiaomi/POCO", "OPPO", "Others"];

export default function Smartphones() {
  const navigate = useNavigate();

  // Data + pagination
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Per-card add-to-cart busy state
  const [addingMap, setAddingMap] = useState({}); // { [phoneId]: true }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setItems([]);
        const data = await api.smartphones.list({
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
          console.error("Failed to load smartphones:", e);
          toast.error(e?.message || "Failed to load smartphones");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, search, ordering, page, pageSize]);

  // Group by brand for sections
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of items) {
      const key = p.brand_display || p.brand || "Others";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return map;
  }, [items]);

  const sectionBrands = useMemo(() => {
    if (filter === "All") return Array.from(grouped.keys());
    return grouped.has(filter) ? [filter] : [];
  }, [filter, grouped]);

  // Reset to page 1 when changing filters/search/order
  useEffect(() => {
    setPage(1);
  }, [filter, search, ordering]);

  const handleBuyNow = async (phone) => {
    if (!phone?.product_id) {
      toast.error("This smartphone is not available for purchase yet.");
      return;
    }
    const pid = phone.id;
    setAddingMap((m) => ({ ...m, [pid]: true }));
    try {
      const updated = await api.cart.add(phone.product_id, 1);
      const newCount = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: newCount } }));
      toast.success(`${phone.name} added to cart`);
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart");
    } finally {
      setAddingMap((m) => {
        const copy = { ...m };
        delete copy[pid];
        return copy;
      });
    }
  };

  // Helper: go to details and scroll to top for nicer UX
  const goToDetail = (id) => {
    try {
      (document.scrollingElement || document.documentElement || document.body)?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
    navigate(`/smartphone/${id}`);
  };

  // Keyboard support for the whole card
  const handleCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetail(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">Top Smartphones in Kenya (2025)</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {BRAND_OPTIONS.map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className={`rounded px-4 py-2 shadow ${
              filter === b ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name/specs/brand…"
          className="w-72 rounded border px-3 py-2"
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="rounded border px-3 py-2"
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
      <div className="mb-6 text-center text-sm text-gray-600">
        {items.length === 0
          ? "No smartphones found."
          : count !== null
          ? `Showing ${items.length} of ${count}`
          : `Showing ${items.length}`}
      </div>

      {/* Sections */}
      {sectionBrands.map((brand) => (
        <section key={brand} className="mb-12">
          <h2 className="mb-4 text-center text-2xl font-semibold">{brand}</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {grouped.get(brand)?.map((p) => {
              const isAdding = !!addingMap[p.id];
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToDetail(p.id)}
                  onKeyDown={(e) => handleCardKeyDown(e, p.id)}
                  className="flex flex-col rounded-lg border bg-white shadow transition hover:shadow-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`View details for ${p.name}`}
                >
                  <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-white">
                    <img
                      src={p.image || FallbackImg}
                      alt={p.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FallbackImg;
                      }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 text-xl font-semibold">{p.name}</h3>

                    <p className="mb-2 text-gray-700">
                      {p.specs_text ||
                        [
                          p.ram_gb ? `${p.ram_gb}GB RAM` : null,
                          p.storage_gb ? `${p.storage_gb}GB Storage` : null,
                          p.camera_mp ? `${p.camera_mp}MP Camera` : null,
                          p.battery_mah ? `${p.battery_mah} mAh` : null,
                          p.display_inches ? `${p.display_inches}" ${p.display_type || ""}`.trim() : null,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "—"}
                    </p>

                    <p className="mb-4 font-bold text-blue-600">
                      {p.price_display ||
                        (p.price_max_ksh
                          ? `${p.price_min_ksh} – ${p.price_max_ksh} KSh`
                          : `${p.price_min_ksh} KSh`)}
                    </p>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        className="rounded bg-gray-100 py-2 text-gray-900 transition hover:bg-gray-200"
                        onClick={(e) => { e.stopPropagation(); goToDetail(p.id); }}
                      >
                        View Details
                      </button>

                      <button
                        className={`rounded py-2 transition ${
                          p.product_id
                            ? isAdding
                              ? "cursor-wait bg-blue-600 text-white opacity-70"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                            : "cursor-not-allowed bg-gray-200 text-gray-500"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!p.product_id || isAdding) return;
                          handleBuyNow(p);
                        }}
                        disabled={!p.product_id || isAdding}
                        title={p.product_id ? "Add to cart" : "Unavailable"}
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
            className={`rounded px-4 py-2 ${
              previous && page > 1
                ? "bg-gray-200 hover:bg-gray-300"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">Page {page}</span>

          <button
            disabled={!next}
            onClick={() => setPage((p) => p + 1)}
            className={`rounded px-4 py-2 ${
              next ? "bg-gray-200 hover:bg-gray-300" : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
