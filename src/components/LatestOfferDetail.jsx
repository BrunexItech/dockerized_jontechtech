import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

export default function LatestOfferDetail() {
  const { id } = useParams(); // /latest-offers/:id -> LatestOffer PK
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // 🔹 Added: anchor + scroll helper to avoid landing under sticky headers
  const topRef = useRef(null);
  const scrollToTopWithOffset = () => {
    const header =
      document.querySelector("header.sticky, header.fixed, [data-header]") || null;
    const headerH = header?.offsetHeight || 0;
    const anchorY =
      (topRef.current?.getBoundingClientRect().top || 0) + window.pageYOffset;
    const y = Math.max(0, anchorY - headerH - 8);
    window.scrollTo({ top: y, behavior: "auto" });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const offer = await api.latestOffers.get(id);
        if (!cancelled) setData(offer);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load offer.");
          toast.error(e?.message || "Failed to load offer", {
            autoClose: 1500,
            position: "top-center",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  // 🔹 Added: after data finishes loading, ensure we’re scrolled to the top (with header offset)
  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        scrollToTopWithOffset();
      });
    }
  }, [id, loading]);

  const handleAddToCart = async () => {
    if (!data?.product_id) {
      toast.error("This offer is not available for purchase yet.", {
        autoClose: 1500,
        position: "top-center",
      });
      return;
    }
    try {
      setAdding(true);
      const updatedCart = await api.cart.add(data.product_id, 1);
      const count = (updatedCart.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
      toast.success(`${data.name} added to cart`, {
        autoClose: 1500,
        position: "top-center",
      });
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart", {
        autoClose: 1500,
        position: "top-center",
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-600">Loading…</div>;
  if (err) return (
    <div className="p-6 text-center">
      <p className="text-red-600 mb-4">Error: {err}</p>
      <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => navigate(-1)}>
        Go Back
      </button>
    </div>
  );
  if (!data) return null;

  const { name, brand, image, price_display, old_price_ksh, labels = [], product_id, slug, created_at } = data;

  return (
    <>
      {/* 🔹 Added: invisible anchor used for accurate top scrolling */}
      <div ref={topRef} />

      <div className="container mx-auto px-4 py-8">
        <button className="mb-6 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="w-full h-96 bg-white border rounded-2xl flex items-center justify-center">
            <img
              src={image || FallbackImg}
              alt={name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => { e.currentTarget.src = FallbackImg; }}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{name}</h1>
            {!!brand && <p className="text-gray-600 mb-1">{brand}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              {labels.map((l, i) => (
                <span key={i} className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded">
                  {String(l).toUpperCase()}
                </span>
              ))}
            </div>

            <p className="text-blue-600 font-semibold text-lg mb-4">{price_display}</p>
            {old_price_ksh ? <p className="text-gray-400 line-through mb-6">{Number(old_price_ksh).toLocaleString()} KSh</p> : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <DetailItem label="Slug" value={slug || "—"} />
            </div>

            <div className="flex gap-3">
              <button
                className={`px-5 py-2 rounded-xl ${
                  product_id ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                onClick={handleAddToCart}
                disabled={!product_id || adding}
              >
                {adding ? "Adding…" : "Add to Cart"}
              </button>

              <button
                className={`px-5 py-2 rounded-xl ${
                  product_id ? "bg-gray-100 hover:bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (!product_id) {
                    toast.error("This offer is not available for purchase yet.", {
                      autoClose: 1500,
                      position: "top-center",
                    });
                    return;
                  }
                  navigate(`/checkout?product_id=${product_id}`);
                }}
                disabled={!product_id}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="border rounded-xl p-3">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}
