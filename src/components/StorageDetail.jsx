import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const FallbackImg = "/images/fallback.jpg";

export default function StorageDetail() {
  const { id } = useParams(); // /storage/:id -> StorageDevice PK
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
        const storage = await api.storages.get(id);
        if (!cancelled) setData(storage);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load storage device.");
          toast.error(e?.message || "Failed to load storage device");
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
    name, brand_display, image, price_display,
    price_min_ksh, price_max_ksh,
    capacity_gb, interface: iface, form_factor,
    specs_text, slug, product_id
  } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="w-full h-96 bg-white border rounded flex items-center justify-center">
          <img
            src={image || FallbackImg}
            alt={name}
            className="max-h-full max-w-full object-contain"
            onError={(e) => { e.currentTarget.src = FallbackImg; }}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{name}</h1>
          <p className="text-gray-600 mb-4">{brand_display}</p>
          <p className="text-blue-600 font-semibold text-lg mb-6">
            {price_display || (price_max_ksh ? `${price_min_ksh} – ${price_max_ksh} KSh` : `${price_min_ksh} KSh`)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <DetailItem label="Capacity" value={capacity_gb ? `${capacity_gb} GB` : "—"} />
            <DetailItem label="Interface" value={iface || "—"} />
            <DetailItem label="Form Factor" value={form_factor || "—"} />
            <DetailItem label="Slug" value={slug || "—"} />
          </div>

          <div className="mb-6">
            <div className="text-xs uppercase text-gray-500 mb-1">Details</div>
            <div className="text-sm">{specs_text || "—"}</div>
          </div>

          <div className="flex gap-3">
            <button
              className={`px-5 py-2 rounded ${
                product_id ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              onClick={handleAddToCart}
              disabled={!product_id || adding}
            >
              {adding ? "Adding…" : "Add to Cart"}
            </button>

            <button
              className={`px-5 py-2 rounded ${
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
    <div className="border rounded p-3">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}
