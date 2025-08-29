import React, { useEffect, useMemo, useState } from "react";
import { FaThLarge, FaThList } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

const BRAND_OPTIONS = [
  "All",
  "SanDisk",
  "WD",
  "Seagate",
  "Toshiba",
  "Samsung",
  "Crucial",
  "Transcend",
  "LaCie",
  "Verbatim",
  "PNY",
  "Others",
];

const StoragePage = () => {
  const navigate = useNavigate();

  // Data + pagination-like controls
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state
  const [filter, setFilter] = useState("All");
  const [ordering, setOrdering] = useState("latest"); // "latest" | "price_low" | "price_high"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Per-card add-to-cart busy state
  const [addingMap, setAddingMap] = useState({}); // { [id]: true }

  // Fetch
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setItems([]);
        const orderingParam =
          ordering === "latest" ? "-created_at"
          : ordering === "price_low" ? "price_min_ksh"
          : ordering === "price_high" ? "-price_min_ksh"
          : "";

        const data = await api.storages.list({
          brand: filter !== "All" ? filter : undefined,
          ordering: orderingParam || undefined,
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
          console.error("Failed to load storages:", e);
          toast.error(e?.message || "Failed to load storage devices");
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filter, ordering, page, pageSize]);

  // Reset to page 1 when changing filters/sorts/pageSize
  useEffect(() => {
    setPage(1);
  }, [filter, ordering, pageSize]);

  const handleBuyNow = async (item) => {
    if (!item?.product_id) {
      toast.error("This item is not available for purchase yet.");
      return;
    }
    const sid = item.id;
    setAddingMap((m) => ({ ...m, [sid]: true }));
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
        delete copy[sid];
        return copy;
      });
    }
  };

  // (Optional) grouped by brand if you ever need sections
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of items) {
      const key = s.brand_display || s.brand || "Others";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
  }, [items]);

  // Card helpers
  const goToDetails = (id) => navigate(`/storage/${id}`);
  const onCardKey = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetails(id);
    }
  };

  return (
    <div className="p-6">
      {/* Persuasive message (unchanged) */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🚀 Upgrade Your Digital Life with the Best Storage Devices!
        </h2>
        <p className="text-gray-600 text-lg">
          Don’t let slow drives hold you back — enjoy faster, safer, and more reliable storage today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          {/* Filter by Brand */}
          <div className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Filter by Brand</h3>
            <div className="flex flex-col gap-2">
              <select
                className="border rounded px-3 py-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {BRAND_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter by Price (visual only) */}
          <div className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Filter by Price</h3>
            <input type="range" min="1500" max="40000" className="w-full" />
            <p className="text-sm mt-2">Price: KSh 1,500 – KSh 40,000</p>
            <button className="mt-3 bg-blue-500 text-white px-4 py-1 rounded">
              Filter
            </button>
          </div>

          {/* Latest Products (static) */}
          <div className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Latest Products</h3>
            <ul className="space-y-3 text-sm">
              <li className="text-blue-600 hover:text-blue-800 transition-colors">Logitech Flight Yoke System - KSh 60,000</li>
              <li className="text-blue-600 hover:text-blue-800 transition-colors">Oraimo MagiPower 15 10000mAh - KSh 8,000</li>
              <li className="text-blue-600 hover:text-blue-800 transition-colors">Oraimo PowerStation 600 - KSh 38,000</li>
              <li className="text-blue-600 hover:text-blue-800 transition-colors">Anker PowerDrive Car Charger - KSh 2,000</li>
              <li className="text-blue-600 hover:text-blue-800 transition-colors">Oraimo Tempo WS-03 Smartwatch - KSh 5,000</li>
              <li className="text-blue-600 hover:text-blue-800 transition-colors">HMD Cest 5G - KSh 14,500</li>
            </ul>
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-3">
          {/* Sort and View options */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <FaThLarge className="cursor-pointer" />
              <FaThList className="cursor-pointer" />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label>Sort by: </label>
              <select
                className="border rounded px-2 py-1"
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
              <label>Show: </label>
              <select
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={60}>60</option>
                <option value={30}>30</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          {/* Results summary */}
          <div className="text-center mb-6 text-sm text-gray-600">
            {items.length === 0
              ? "No storage devices found."
              : count !== null
                ? `Showing ${items.length} of ${count}`
                : `Showing ${items.length}`}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((product) => {
              const isAdding = !!addingMap[product.id];
              return (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${product.name}`}
                  onClick={() => goToDetails(product.id)}
                  onKeyDown={(e) => onCardKey(e, product.id)}
                  className="border rounded-lg p-3 shadow-sm relative transform transition duration-300 hover:scale-105 hover:shadow-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  {!!product.price_max_ksh && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Offer
                    </span>
                  )}
                  <div className="w-full h-40 flex items-center justify-center">
                    <img
                      src={product.image || FallbackImg}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.src = FallbackImg; }}
                      loading="lazy"
                    />
                  </div>
                  <h4 className="text-sm font-semibold mb-1 mt-3">{product.name}</h4>
                  <p className="text-gray-700 font-bold mb-3">
                    {product.price_display ||
                      (product.price_max_ksh
                        ? `${product.price_min_ksh} – ${product.price_max_ksh} KSh`
                        : `${product.price_min_ksh} KSh`)}
                  </p>

                  {/* Buttons stacked vertically */}
                  <div className="flex flex-col gap-2">
                    <button
                      className="bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded transition"
                      onClick={(e) => {
                        e.stopPropagation(); // don't trigger card click
                        goToDetails(product.id);
                      }}
                    >
                      View Details
                    </button>

                    <button
                      className={`py-2 rounded transition ${
                        product.product_id
                          ? isAdding
                            ? "bg-blue-600 text-white opacity-70 cursor-wait"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // don't trigger card click
                        if (!product.product_id || isAdding) return;
                        handleBuyNow(product);
                      }}
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

          {/* Simple Prev/Next if DRF pagination is on */}
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
      </div>
    </div>
  );
};

export default StoragePage;
