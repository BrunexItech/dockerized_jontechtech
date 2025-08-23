// src/pages/TelevisionDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

export default function TelevisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const tv = await api.televisions.get(id);
        if (!cancelled) setData(tv);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load television.");
          toast.error(e?.message || "Failed to load television");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!data?.product_id) {
      toast.error("This item is not available for purchase yet.");
      return;
    }
    try {
      setAdding(true);
      const updatedCart = await api.cart.add(data.product_id, 1);
      const count = (updatedCart.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));
      toast.success(`${data.name} added to cart`);
    } catch (e) {
      toast.error(e?.message || "Failed to add to cart");
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

  const {
    name, brand_display, panel_display, resolution_display,
    image, price_display, price_min_ksh, price_max_ksh,
    specs_text, smart, hdr, refresh_rate_hz, screen_size_inches, slug, product_id,
  } = data;

  return (
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
          <p className="text-gray-600 mb-1">{brand_display}</p>
          <p className="text-gray-600 mb-4">
            {screen_size_inches}" • {panel_display} • {resolution_display}
          </p>
          <p className="text-indigo-600 font-semibold text-lg mb-6">
            {price_display || (price_max_ksh ? `${price_min_ksh} – ${price_max_ksh} KSh` : `${price_min_ksh} KSh`)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <DetailItem label="Smart TV" value={smart ? "Yes" : "No"} />
            <DetailItem label="HDR" value={hdr ? "Yes" : "No"} />
            <DetailItem label="Refresh Rate" value={refresh_rate_hz ? `${refresh_rate_hz} Hz` : "—"} />
            <DetailItem label="Size" value={screen_size_inches ? `${screen_size_inches}"` : "—"} />
            <DetailItem label="Slug" value={slug || "—"} />
            <DetailItem label="Specs" value={specs_text || "—"} />
          </div>

          <div className="flex gap-3">
            <button
              className={`px-5 py-2 rounded-xl ${
                product_id ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
                  toast.error("This item is not available for purchase yet.");
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
