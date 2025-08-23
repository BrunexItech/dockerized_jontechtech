// src/Pages/OrderConfirmation.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [receiptReady, setReceiptReady] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [resending, setResending] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Load order details
  useEffect(() => {
    (async () => {
      try {
        const data = await api.orders.getById(id);
        setOrder(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Poll receipt status until ready (or up to ~60s)
  useEffect(() => {
    let attempts = 0;
    let timer = null;

    async function check() {
      attempts += 1;
      try {
        const s = await api.orders.receiptStatus(id);
        if (s.ready) {
          setReceiptReady(true);
          setReceiptUrl(s.download_url || api.orders.downloadUrl(id));
          return; // stop polling
        }
      } catch {
        // ignore
      }
      if (attempts < 15) { // 15 * 4s = 60s
        timer = setTimeout(check, 4000);
      }
    }

    check();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const money = (v) => {
    const n = Number(v || 0);
    return `Ksh ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const issuedAt = useMemo(() => {
    if (!order?.created_at) return "";
    try {
      return new Date(order.created_at).toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(order.created_at);
    }
  }, [order?.created_at]);

  const resend = async () => {
    try {
      setResending(true);
      await api.orders.emailReceipt(id);
      setToastMsg("Receipt sent to your email.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {
      setToastMsg(e.message || "Failed to resend receipt.");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <section className="px-6 py-10 flex justify-center">
        <div className="animate-pulse text-gray-500">Loading receipt…</div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 print:p-0">
      {/* Narrow, receipt-like container */}
      <div
        className={[
          "mx-auto w-full max-w-md bg-white shadow-xl rounded-xl overflow-hidden",
          "print:max-w-none print:shadow-none print:rounded-none print:w-[80mm]",
        ].join(" ")}
      >
        {/* Perforated top edge (visual only) */}
        <div className="relative h-3 bg-gray-100">
          <div className="absolute inset-x-0 -bottom-1 h-2 bg-white"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12px -4px, transparent 8px, #e5e7eb 9px)",
              backgroundSize: "24px 8px",
              backgroundRepeat: "repeat-x",
            }}
          />
        </div>

        {/* Header / Store info */}
        <div className="px-5 pt-5 pb-2 text-center">
          <h1 className="text-lg font-extrabold tracking-widest">JONTECH</h1>
          <p className="text-xs text-gray-500">Thank you for your purchase</p>
        </div>

        {/* Meta lines */}
        <div className="px-5 py-3 text-xs font-mono text-gray-700">
          <div className="flex justify-between">
            <span>Receipt</span>
            <span className="uppercase">{order?.status || "PENDING"}</span>
          </div>
          <div className="flex justify-between">
            <span>Order ID</span>
            <span>#{order?.id ?? id}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{issuedAt}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment</span>
            <span className="uppercase">{order?.payment_method || "cod"}</span>
          </div>
          {order?.receipt_number && (
            <div className="flex justify-between">
              <span>Receipt No.</span>
              <span>{order.receipt_number}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-dashed border-gray-300" />

        {/* Line items */}
        <div className="px-5 py-3">
          <h2 className="text-xs tracking-widest text-gray-500 mb-2">ITEMS</h2>
          <div className="space-y-2">
            {(order?.items || []).map((it, idx) => (
              <div key={idx} className="font-mono text-sm">
                <div className="flex justify-between">
                  <span className="pr-3 break-words">{it.name}</span>
                  <span>{money(it.line_total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>
                    Qty: {it.quantity}
                    {"  "}
                    @ {money(it.unit_price)}
                  </span>
                  <span>({(Number(it.line_total) || 0).toFixed(2)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashed divider */}
        <div className="mx-5 border-t border-dashed border-gray-300" />

        {/* Totals */}
        <div className="px-5 py-3 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{money(order?.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span>{money(order?.shipping_fee)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold">
            <span>Total</span>
            <span>{money(order?.total)}</span>
          </div>
        </div>

        {/* Faux barcode */}
        <div className="px-5 pt-2 pb-4">
          <div
            className="h-10 w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#111,#111 2px,transparent 2px,transparent 4px)",
            }}
          />
          <div className="text-center text-xs font-mono text-gray-600 mt-1">
            {String(order?.id ?? id).padStart(10, "0")}
          </div>
        </div>

        {/* Perforated bottom edge */}
        <div className="relative h-3 bg-gray-100">
          <div className="absolute inset-x-0 -top-1 h-2 bg-white"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12px 6px, transparent 8px, #e5e7eb 9px)",
              backgroundSize: "24px 8px",
              backgroundRepeat: "repeat-x",
            }}
          />
        </div>
      </div>

      {/* Actions (hidden when printing) */}
      <div className="mt-6 flex flex-col items-center justify-center gap-3 print:hidden">
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Print receipt
          </button>

          <a
            href={receiptUrl || "#"}
            onClick={(e) => { if (!receiptReady) e.preventDefault(); }}
            className={[
              "px-4 py-2 rounded",
              receiptReady ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-600 cursor-not-allowed"
            ].join(" ")}
            download
          >
            {receiptReady ? "Download PDF" : "Preparing receipt…"}
          </a>

          <button
            onClick={resend}
            disabled={resending}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend to my email"}
          </button>
        </div>

        <Link
          to="/"
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Continue shopping
        </Link>

        {toastMsg && <div className="text-sm text-gray-700 mt-2">{toastMsg}</div>}
      </div>
    </section>
  );
}
