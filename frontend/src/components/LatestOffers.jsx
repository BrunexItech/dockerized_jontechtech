import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";
const LABEL_FILTERS = ["All", "NEW", "HOT", "SALE"]; // quick filters

const labelColor = (label) => {
  const l = (label || "").toLowerCase();
  if (l === "new") return "bg-green-500";
  if (l === "hot") return "bg-blue-500";
  if (l === "sale") return "bg-red-500";
  return "bg-yellow-400";
};

const LatestOffers = () => {
  const navigate = useNavigate();

  // data/pagination
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(null);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  // UI state
  const [brand, setBrand] = useState("All");
  const [label, setLabel] = useState("All");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // per-card add state
  const [addingMap, setAddingMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setItems([]);

        const data = await api.latestOffers.list({
          brand: brand !== "All" ? brand : undefined,
          label: label !== "All" ? label : undefined,
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
          console.error("Failed to load latest offers:", e);
          toast.error(e?.message || "Failed to load latest offers", {
            autoClose: 1500,
            position: "top-center",
          }); // 👈 toast updated
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [brand, label, search, ordering, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [brand, label, search, ordering]);

  const handleAddToCart = async (offer) => {
    if (!offer?.product_id) {
      toast.error("This offer is not available for purchase yet.", {
        autoClose: 1500,
        position: "top-center",
      }); // 👈 toast updated
      return;
    }
    const id = offer.id;
    setAddingMap((m) => ({ ...m, [id]: true }));
    try {
      const updated = await api.cart.add(offer.product_id, 1);
      const count = (updated.items || []).reduce(
        (acc, i) => acc + (i.quantity || 0),
        0
      );
      window.dispatchEvent(
        new CustomEvent("cart-updated", { detail: { count } })
      );
      toast.success(`${offer.name} added to cart`, {
        autoClose: 1500,
        position: "top-center",
      }); // 👈 toast updated
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart", {
        autoClose: 1500,
        position: "top-center",
      }); // 👈 toast updated
    } finally {
      setAddingMap((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };

  // collect unique brands for filter dropdown
  const brands = useMemo(() => {
    const set = new Set(items.map((x) => x.brand).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  // navigate to details (using latest-offers route you already have)
  const goToDetails = (product) => {
    navigate(`/latest-offers/${product.id}`);
  };

  return (
    <section className="px-4 py-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Latest Offers</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {/* Brand */}
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search offers…"
          className="border rounded px-3 py-2 w-64"
        />

        {/* Label quick pills */}
        <div className="flex flex-wrap gap-2">
          {LABEL_FILTERS.map((l) => {
            const active = l === label;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  active
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>

        {/* Ordering */}
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="price_min_ksh">Price (low → high)</option>
          <option value="-price_min_ksh">Price (high → low)</option>
          <option value="name">Name (A→Z)</option>
          <option value="-name">Name (Z→A)</option>
        </select>
      </div>

      {/* Results summary */}
      <div className="text-center mb-6 text-sm text-gray-600">
        {items.length === 0
          ? "No offers found."
          : count !== null
          ? `Showing ${items.length} of ${count}`
          : `Showing ${items.length}`}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => {
          const isAdding = !!addingMap[product.id];
          return (
            <div
              key={product.id}
              className="border rounded-lg p-3 shadow hover:shadow-xl relative bg-white transform transition-transform duration-300 hover:scale-105 cursor-pointer"
              onClick={() => goToDetails(product)} // 👈 card click to details
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToDetails(product);
                }
              }}
              aria-label={`View details for ${product.name}`}
            >
              {/* Labels */}
              <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                {(product.labels || []).map((label, index) => (
                  <span
                    key={index}
                    className={`${labelColor(
                      label
                    )} text-white text-xs px-2 py-0.5 rounded`}
                  >
                    {String(label || "").toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Product Image */}
              <img
                src={product.image || FallbackImg}
                alt={product.name}
                className="w-full h-48 object-contain rounded-md mt-6 bg-gray-100 transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = FallbackImg;
                }}
                loading="lazy"
              />

              {/* Product Name */}
              <h3 className="mt-3 text-sm font-medium line-clamp-2">
                {product.name}
              </h3>

              {/* Price */}
              <div className="text-sm font-semibold mb-3">
                <p className="text-blue-600">{product.price_display}</p>
                {product.old_price_ksh ? (
                  <p className="text-gray-400 line-through">
                    {Number(product.old_price_ksh).toLocaleString()} KSh
                  </p>
                ) : null}
              </div>

              {/* Actions */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                onClick={(e) => e.stopPropagation()} // 👈 prevent card click when pressing buttons
              >
                <button
                  className="w-full border bg-white text-gray-900 py-2 text-sm sm:py-2.5 sm:text-sm md:py-3 md:text-base font-medium rounded-lg hover:bg-gray-50 shadow-sm transition"
                  onClick={() => navigate(`/latest-offers/${product.id}`)}
                >
                  View Details
                </button>

                <button
                  className={`w-full py-2 text-sm sm:py-2.5 sm:text-sm md:py-3 md:text-base font-medium rounded-lg shadow-sm transition ${
                    product.product_id
                      ? isAdding
                        ? "bg-blue-600 text-white opacity-70 cursor-wait"
                        : "bg-black hover:bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (!product.product_id || isAdding) return;
                    handleAddToCart(product);
                  }}
                  disabled={!product.product_id || isAdding}
                  title={product.product_id ? "Add to cart" : "Unavailable"}
                >
                  {isAdding ? "Adding…" : "ADD TO CART"}
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
            onClick={() => setPage((p) => p + 1)} // ✅ fixed bug: removed extra ")"
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
};

export default LatestOffers;
