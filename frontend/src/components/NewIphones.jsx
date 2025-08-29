import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import api from "../api";
import { toast } from "react-toastify";

import ip7 from "../assets/ip7.jpg"; // fallback local
const FallbackImg = "/images/fallback.jpg";

export default function NewIphones() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  const [badgeFilter, setBadgeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [addingMap, setAddingMap] = useState({});
  const [wishlist, setWishlist] = useState([]);

  const [banner, setBanner] = useState(null);

  // load products
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setItems([]);
        const data = await api.newIphones.list({
          badge: badgeFilter !== "All" ? badgeFilter : undefined,
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
          console.error("Failed to load new iphones:", e);
          toast.error(e?.message || "Failed to load new iPhones");
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [badgeFilter, search, ordering, page, pageSize]);

  // load banner
  useEffect(() => {
    let cancelled = false;
    async function loadBanner() {
      try {
        const data = await api.newIphones.banner();
        if (!cancelled && data && data.banner_image) setBanner(data.banner_image);
      } catch (e) {
        console.warn("No global banner or failed to load:", e?.message || e);
      }
    }
    loadBanner();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => setPage(1), [badgeFilter, search, ordering]);

  const pageBanner = banner || ip7;

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleBuyNow = async (item) => {
    if (!item?.product_id) {
      toast.error("This item is not available for purchase yet.");
      return;
    }
    const id = item.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(item.product_id, 1);
      const count = (updated.items || []).reduce(
        (acc, i) => acc + (i.quantity || 0),
        0
      );
      window.dispatchEvent(
        new CustomEvent("cart-updated", { detail: { count } })
      );
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

  const goToDetail = (id) => {
    try {
      (document.scrollingElement ||
        document.documentElement ||
        document.body)?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (_) {}
    navigate(`/new-iphones/${id}`);
  };

  const handleCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetail(id);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          New iPhones
        </h2>
        <span className="text-lg font-medium text-green-500 italic">
          Premium Collection
        </span>
      </div>

      {/* Banner */}
      <div className="mb-10 rounded-2xl overflow-hidden shadow-2xl relative">
        <img
          src={pageBanner}
          alt="iPhone Banner"
          className="w-full h-[450px] object-cover transition-transform duration-700 hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = FallbackImg;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <select
            value={badgeFilter}
            onChange={(e) => setBadgeFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option>All</option>
            <option>HOT</option>
            <option>NEW</option>
            <option>SALE</option>
            <option>NONE</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name/specs…"
            className="border rounded px-3 py-2 w-72"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Default order</option>
            <option value="-created_at">Newest</option>
            <option value="new_price_ksh">Price (low → high)</option>
            <option value="-new_price_ksh">Price (high → low)</option>
            <option value="name">Name (A→Z)</option>
          </select>
        </div>
      </div>

      {/* Results summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0
          ? "No iPhones found."
          : count !== null
          ? `Showing ${items.length} of ${count}`
          : `Showing ${items.length}`}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
        {items.map((product) => {
          const isAdding = !!addingMap[product.id];

          return (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => goToDetail(product.id)}
              onKeyDown={(e) => handleCardKeyDown(e, product.id)}
              className="group bg-white rounded-xl shadow hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:-translate-y-0.5 relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`View details for ${product.name}`}
            >
              <div className="relative overflow-hidden">
                {product.badge && product.badge !== "NONE" && (
                  <span
                    className={`absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow ${
                      product.badge === "SALE"
                        ? "bg-red-500 text-white"
                        : product.badge === "NEW"
                        ? "bg-blue-600 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-3 right-3 bg-white/95 p-2 rounded-full shadow hover:scale-110 transition"
                  aria-label={
                    wishlist.includes(product.id)
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  <Heart
                    size={18}
                    className={
                      wishlist.includes(product.id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-600"
                    }
                  />
                </button>

                <img
                  src={product.image || FallbackImg}
                  alt={product.name}
                  className="w-full h-[280px] md:h-[320px] object-contain bg-white group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = FallbackImg;
                  }}
                />
              </div>

              <div className="p-5 relative z-10 bg-white">
                <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-gray-700 transition">
                  {product.name}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base text-black font-semibold">
                    KSh {product.new_price_ksh?.toLocaleString()}
                  </span>
                  {product.old_price_ksh ? (
                    <span className="text-gray-400 line-through text-xs">
                      KSh {product.old_price_ksh?.toLocaleString()}
                    </span>
                  ) : null}
                </div>

                <div className="text-green-600 text-xs mt-1">
                  Save{" "}
                  {product.old_price_ksh
                    ? Math.round(
                        ((product.old_price_ksh - product.new_price_ksh) /
                          product.old_price_ksh) *
                          100
                      )
                    : 0}
                  %
                </div>

                {/* Slim, stacked buttons */}
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 py-2 px-3 text-sm font-medium transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToDetail(product.id);
                    }}
                  >
                    View Details
                  </button>

                  <button
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition ${
                      product.product_id
                        ? isAdding
                          ? "bg-blue-600 text-white opacity-70 cursor-wait"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!product.product_id || isAdding) return;
                      handleBuyNow(product);
                    }}
                    disabled={!product.product_id || isAdding}
                  >
                    {isAdding ? "Adding…" : (<><ShoppingCart size={15} /> Add to Cart</>)}
                  </button>
                </div>
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
              previous && page > 1
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            disabled={!next}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded ${
              next
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
