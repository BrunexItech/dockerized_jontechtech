import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";

const getTitle = (x) =>
  x?.name || x?.title || x?.model || x?.slug || x?.username || "Untitled";
const getImage = (x) =>
  x?.image || x?.thumbnail || x?.main_image || x?.photo || x?.cover || null;
const getPrice = (x) =>
  x?.price ?? x?.sale_price ?? x?.amount ?? null;

const getDetailPath = (type, x) => {
  const id = x?.id ?? x?.pk ?? x?.slug ?? "";
  switch (type) {
    case "smartphones": return `/smartphones/${id}`;
    case "tablets": return `/tablets/${id}`;
    case "reallaptops": return `/reallaptops/${id}`;
    case "televisions": return `/televisions/${id}`;
    case "audio": return `/audio/${id}`;
    case "accessories": return `/mobile-accessories/${id}`;
    case "storages": return `/storage/${id}`;
    case "mkopa": return `/mkopa/${id}`;
    case "newIphones": return `/new-iphones/${id}`;
    case "budgetSmartphones": return `/budget-smartphones/${id}`;
    case "dialPhones": return `/dial-phones/${id}`;
    case "latestOffers": return `/latest-offers/${id}`;
    default: return `/${type}/${id}`;
  }
};

const Section = ({ title, type, items }) => {
  if (!items || !items.length) return null;
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
      <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const img = getImage(item);
          const href = getDetailPath(type, item);
          return (
            <li key={`${type}-${item.id || item.slug || Math.random()}`} className="border rounded-lg p-3 hover:shadow-sm">
              <Link to={href} className="block">
                {img ? (
                  <img
                    src={img}
                    alt={getTitle(item)}
                    className="w-full h-40 object-contain mb-2"
                    loading="lazy"
                  />
                ) : null}
                <div className="text-sm text-gray-900 line-clamp-2">{getTitle(item)}</div>
                {getPrice(item) != null && (
                  <div className="mt-1 font-semibold">
                    {Intl.NumberFormat().format(Number(getPrice(item)))}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">{title}</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = useMemo(() => (params.get("q") || "").trim(), [params]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    smartphones: [],
    tablets: [],
    reallaptops: [],
    televisions: [],
    audio: [],
    accessories: [],
    storages: [],
    mkopa: [],
    newIphones: [],
    budgetSmartphones: [],
    dialPhones: [],
    latestOffers: [],
  });

  const totalCount = Object.values(data).reduce((n, arr) => n + (arr?.length || 0), 0);

  useEffect(() => {
    let alive = true;
    const go = async () => {
      setLoading(true);
      try {
        if (!q) {
          setData({
            smartphones: [], tablets: [], reallaptops: [], televisions: [],
            audio: [], accessories: [], storages: [], mkopa: [],
            newIphones: [], budgetSmartphones: [], dialPhones: [], latestOffers: []
          });
        } else {
          const res = await api.search.all(q, { limit: 12 });
          if (alive) setData(res);
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    go();
    return () => { alive = false; };
  }, [q]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold text-gray-900">Search results</h2>
      <p className="text-sm text-gray-500 mb-6">
        {q ? <>Showing results for <span className="font-medium">“{q}”</span></> : "Enter a query to search."}
      </p>

      {loading ? (
        <div className="text-gray-600">Searching…</div>
      ) : !q ? (
        <div className="text-gray-600">Try searching by brand or model name.</div>
      ) : totalCount === 0 ? (
        <div className="text-gray-700 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          Item not found. Try a different keyword or check the spelling.
        </div>
      ) : (
        <>
          <Section title="Smartphones"        type="smartphones"        items={data.smartphones} />
          <Section title="Tablets"            type="tablets"            items={data.tablets} />
          <Section title="Laptops"            type="reallaptops"        items={data.reallaptops} />
          <Section title="Televisions"        type="televisions"        items={data.televisions} />
          <Section title="Audio"              type="audio"              items={data.audio} />
          <Section title="Mobile accessories" type="accessories"        items={data.accessories} />
          <Section title="Storage devices"    type="storages"           items={data.storages} />
          <Section title="M-KOPA Phones"      type="mkopa"              items={data.mkopa} />
          <Section title="New iPhones"        type="newIphones"         items={data.newIphones} />
          <Section title="Budget smartphones" type="budgetSmartphones"  items={data.budgetSmartphones} />
          <Section title="Dial phones"        type="dialPhones"         items={data.dialPhones} />
          <Section title="Latest offers"      type="latestOffers"       items={data.latestOffers} />
        </>
      )}
    </div>
  );
}
