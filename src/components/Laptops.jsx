// src/Pages/Laptops.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const placeholder = "https://via.placeholder.com/600x400?text=Product";

/** Card Component */
const LaptopCard = ({
  id,
  image,
  name,
  brand,
  price,
  oldPrice,
  discount,
  desc,
  onAddToCart,
  adding = false,
}) => {
  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl">
      {discount && (
        <span className="absolute top-2 left-2 z-10 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
          {discount}
        </span>
      )}

      {/* Product Image */}
      <div className="relative overflow-hidden">
        <Link to={`/product/${id}`} className="block">
          <img
            src={image}
            alt={name}
            className="w-full h-56 object-cover transform transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
      </div>

      {/* Hover Buttons BELOW image */}
      <div className="h-0 overflow-hidden group-hover:h-20 transition-all duration-300 bg-white border-t border-gray-200 flex items-center justify-center gap-3 px-4">
        {/* Quick View */}
        <Link
          to={`/product/${id}`}
          className="flex-1 bg-orange-600 text-white text-center py-2 rounded-lg shadow-md hover:bg-orange-700 hover:scale-105 transform transition text-sm font-medium"
        >
          QUICK VIEW
        </Link>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart(id, name)}
          disabled={adding}
          className="flex-1 bg-orange-600 text-white py-2 rounded-lg shadow-md hover:bg-orange-700 hover:scale-105 transform transition text-sm font-medium disabled:opacity-60 disabled:hover:scale-100"
        >
          {adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mt-1">{name}</h3>
        <p className="text-gray-600 text-sm">{brand}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-orange-600 font-bold">{price}</span>
          {oldPrice && (
            <span className="text-gray-400 line-through text-sm">{oldPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Main Laptops Section */
const Laptops = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [addingMap, setAddingMap] = useState({}); // { [productId]: true }

  useEffect(() => {
    let ignore = false;

    api.products.list()
      .then((data) => {
        if (ignore) return;
        const mapped = data.map((p) => ({
          id: p.id,
          image: p.image || placeholder,
          name: p.name,
          brand: p.brand || "",
          price: `Ksh ${p.price}`,
          oldPrice: p.old_price ? `Ksh ${p.old_price}` : null,
          discount: p.discount || "",
          desc: p.desc || "",
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  // Add to cart handler with toast
  const handleAddToCart = async (productId, productName = "Item") => {
    try {
      setAddingMap((m) => ({ ...m, [productId]: true }));
      await api.cart.add(productId, 1); // Add 1 item
      window.dispatchEvent(new Event("auth-changed")); // Update cart count in header
      toast.success(`${productName} added to cart`);
    } catch (err) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAddingMap((m) => {
        const copy = { ...m };
        delete copy[productId];
        return copy;
      });
    }
  };

  if (loading) return <section className="px-6 py-10">Loading…</section>;
  if (error)   return <section className="px-6 py-10 text-red-600">Error: {error}</section>;

  return (
    <section className="px-6 py-10">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Top Laptops for Work, School & Play</h2>
        <p className="text-gray-600 mt-2">
          Choose from trusted global brands at the best local prices in Ksh.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <LaptopCard
            key={p.id}
            {...p}
            onAddToCart={handleAddToCart}
            adding={!!addingMap[p.id]}
          />
        ))}
      </div>
    </section>
  );
};

export default Laptops;
