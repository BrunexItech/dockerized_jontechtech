// src/pages/Televisions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

const BRAND_OPTIONS = ["All", "Samsung", "LG", "Sony", "Hisense", "Vitron", "TCL", "Unbranded"];
const PANEL_OPTIONS = ["All", "LED", "QLED", "OLED", "NanoCell", "Crystal", "Other"];
const RES_OPTIONS = ["All", "HD", "FHD", "UHD", "8K"];

export default function Televisions() {
  const navigate = useNavigate();

  // data/pagination
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state
  const [brand, setBrand] = useState("All");
  const [panel, setPanel] = useState("All");
  const [resolution, setResolution] = useState("All");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // per-card add state
  const [addingMap, setAddingMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setItems([]);
        const data = await api.televisions.list({
          brand: brand !== "All" ? brand : undefined,
          panel: panel !== "All" ? panel : undefined,
          resolution: resolution !== "All" ? resolution : undefined,
          min_size: minSize || undefined,
          max_size: maxSize || undefined,
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
          console.error("Failed to load televisions:", e);
          toast.error(e?.message || "Failed to load televisions");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [brand, panel, resolution, minSize, maxSize, search, ordering, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [brand, panel, resolution, minSize, maxSize, search, ordering]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const tv of items) {
      const key = tv?.brand_display || tv?.brand || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tv);
    }
    return map;
  }, [items]);

  const sectionOrder = useMemo(() => Array.from(grouped.keys()), [grouped]);

  const handleBuyNow = async (tv) => {
    if (!tv?.product_id) {
      toast.error("This item is not available for purchase yet.");
      return;
    }
    const id = tv.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(tv.product_id, 1);
      const newCount = (updated.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count: newCount } }));
      toast.success(`${tv.name} added to cart`);
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
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-2 text-center">Shop Televisions in Kenya (2025)</h1>
      <p className="text-center text-gray-600 mb-6">
        OLED, QLED, LED, 4K &amp; 8K smart TVs—find your perfect screen size and panel.
      </p>

      {/* Brand filter as pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {BRAND_OPTIONS.map((b) => (
          <button
            key={b}
            onClick={() => setBrand(b)}
            className={`px-4 py-2 rounded-full border text-sm transition ${
              brand === b
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Other Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        {/* Panel */}
        <select value={panel} onChange={(e) => setPanel(e.target.value)} className="border rounded px-3 py-2">
          {PANEL_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Resolution */}
        <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="border rounded px-3 py-2">
          {RES_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Size range */}
        <input
          value={minSize}
          onChange={(e) => setMinSize(e.target.value)}
          placeholder="Min size (inches)"
          className="border rounded px-3 py-2 w-40"
          inputMode="numeric"
        />
        <input
          value={maxSize}
          onChange={(e) => setMaxSize(e.target.value)}
          placeholder="Max size (inches)"
          className="border rounded px-3 py-2 w-40"
          inputMode="numeric"
        />

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name/brand/panel…"
          className="border rounded px-3 py-2 w-72"
        />

        {/* Ordering */}
        <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Default order</option>
          <option value="created_at">Created (oldest first)</option>
          <option value="-created_at">Created (newest first)</option>
          <option value="price_min_ksh">Price (low first)</option>
          <option value="-price_min_ksh">Price (high first)</option>
          <option value="screen_size_inches">Size (small→large)</option>
          <option value="-screen_size_inches">Size (large→small)</option>
          <option value="name">Name (A→Z)</option>
          <option value="-name">Name (Z→A)</option>
        </select>
      </div>

      {/* Results summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0
          ? "No televisions found."
          : count !== null
          ? `Showing ${items.length} of ${count}`
          : `Showing ${items.length}`}
      </div>

      {/* Brand sections */}
      {sectionOrder.map((brandKey) => (
        <section key={brandKey} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">{brandKey}</h2>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {grouped.get(brandKey)?.map((tv) => {
              const isAdding = !!addingMap[tv.id];
              const sizeBadge = `${tv?.screen_size_inches ?? ""}"`;
              const panelBadge = tv?.panel_display || tv?.panel || "";
              const specLine =
                tv?.specs_text ||
                `${tv?.resolution_display || tv?.resolution || ""} • ${
                  tv?.refresh_rate_hz ? `${tv.refresh_rate_hz}Hz` : "60Hz"
                }`;

              return (
                <div
                  key={tv.id}
                  className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Subtle gradient header bar */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-500/70 via-indigo-500/70 to-purple-500/70" />

                  <div className="p-4 flex flex-col flex-1">
                    <div className="relative w-full h-56 bg-white rounded-xl border flex items-center justify-center mb-3">
                      <img
                        src={tv.image || FallbackImg}
                        alt={tv.name}
                        className="max-h-full max-w-full object-contain transform transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = FallbackImg;
                        }}
                      />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-2">
                        {tv.smart && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Smart TV
                          </span>
                        )}
                        {tv.hdr && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            HDR
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border">
                        {sizeBadge} • {panelBadge}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold leading-snug mb-1 line-clamp-2">{tv.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{specLine}</p>

                    <div className="text-indigo-600 font-bold text-base mb-4">{tv.price_display}</div>

                    {/* Vertical buttons */}
                    <div className="mt-auto grid grid-cols-1 gap-2">
                      <button
                        className="inline-flex items-center justify-center rounded-xl border bg-white hover:bg-gray-50 text-gray-900 py-2 px-3 transition"
                        onClick={() => navigate(`/televisions/${tv.id}`)}
                      >
                        View Details
                      </button>

                      <button
                        className={`inline-flex items-center justify-center rounded-xl py-2 px-3 transition ${
                          tv.product_id
                            ? isAdding
                              ? "bg-indigo-600 text-white opacity-70 cursor-wait"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (!tv.product_id || isAdding) return;
                          handleBuyNow(tv);
                        }}
                        disabled={!tv.product_id || isAdding}
                        title={tv.product_id ? "Add to cart" : "Unavailable"}
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
