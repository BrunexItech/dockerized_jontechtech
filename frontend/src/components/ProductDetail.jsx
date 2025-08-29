// src/Pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";

const placeholder = "https://via.placeholder.com/600x400?text=Product";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [adding, setAdding]     = useState(false);

  useEffect(() => {
    let ignore = false;

    api.products.get(id)
      .then((data) => {
        if (ignore) return;
        setProduct({
          ...data,
          image: data.image || placeholder,
        });
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAdding(true);
      // Backend returns the updated cart
      const data = await api.cart.add(product.id, 1);

      // Broadcast updated count to Header
      const count = (data.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { count } }));

      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <section className="px-6 py-10">Loading…</section>;
  if (error) return <section className="px-6 py-10 text-red-600">Error: {error}</section>;
  if (!product) return <section className="px-6 py-10">Product not found.</section>;

  return (
    <section className="px-6 py-10 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-10 bg-white shadow-xl rounded-2xl overflow-hidden">
        
        {/* Left: Product Image */}
        <div className="flex items-center justify-center bg-gray-100 p-6">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-[500px] object-contain rounded-lg"
          />
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col justify-between p-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.brand && (
              <p className="text-gray-600 mt-1">{product.brand}</p>
            )}
            {product.desc && (
              <p className="text-gray-700 leading-relaxed mt-4">{product.desc}</p>
            )}

            {/* Pricing */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-2xl font-bold text-orange-600">
                Ksh {product.price}
              </span>
              {product.old_price && (
                <span className="text-gray-400 line-through text-lg">
                  Ksh {product.old_price}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="mt-8 w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-medium 
                       hover:bg-orange-700 hover:scale-105 transform transition duration-300 shadow-md
                       disabled:opacity-60 disabled:hover:scale-100"
          >
            {adding ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
