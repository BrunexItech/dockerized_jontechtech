















// src/api.js
// Single source of truth for API calls in Vite/React.

function getBaseUrl() {
  // Prefer explicit env if provided; strip trailing slash
  let envUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
  // If empty -> SAME ORIGIN (best for ngrok/mobile)
  return envUrl; // "" means same-origin
}

/* ------------------------- Token storage helpers ------------------------- */
export function setTokens({ access, refresh, user } = {}) {
  if (access) localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed"));
}

export function getAccessToken() {
  return localStorage.getItem("access");
}

export function getUser() {
  const raw = localStorage.getItem("user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth-changed"));
}

/* ------------------------------ Error helper ----------------------------- */
function firstMessage(payload) {
  if (!payload) return "Request failed.";
  if (typeof payload === "string") {
    if (payload === "Authentication credentials were not provided.") {
      return "Please login or Sign up to make a purchase";
    }
    return payload;
  }
  if (Array.isArray(payload)) return payload.length ? firstMessage(payload[0]) : "Request failed.";
  if (payload.detail) return firstMessage(payload.detail);
  const k = Object.keys(payload)[0];
  return k ? firstMessage(payload[k]) : "Request failed.";
}

/* --------------------------- Query string helper -------------------------- */
function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s !== "") u.set(k, s);
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

/* ------------------------------- Core fetch ------------------------------- */
async function coreFetch(path, { method = "GET", body, headers } = {}, auth = false) {
  const base = getBaseUrl(); // "" or absolute https://...
  const url = `${base}${path}`; // if base="" -> same-origin

  const h = { "Content-Type": "application/json", ...(headers || {}) };
  if (auth) {
    const token = getAccessToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
    // If you ever switch to cookie-based sessions, add:
    // credentials: "include",
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) throw new Error(firstMessage(data) || `HTTP ${res.status}`);
  return data;
}

export function request(path, opts = {}) {
  return coreFetch(path, opts, false);
}
export function authRequest(path, opts = {}) {
  return coreFetch(path, opts, true);
}

/* --------------------------------- API ----------------------------------- */
export const api = {
  /* ------------------------------- Auth ------------------------------- */
  register(payload) {
    return request("/api/auth/register/", { method: "POST", body: payload });
  },

  async login({ email, password }) {
    const data = await request("/api/auth/login/", {
      method: "POST",
      body: { email, password },
    });
    setTokens({ access: data.access, refresh: data.refresh, user: data.user });
    return data;
  },

  me() {
    return authRequest("/api/auth/me/");
  },

  // Password reset
  forgotPassword({ email }) {
    return request("/api/auth/forgot-password/", { method: "POST", body: { email } });
  },

  resetPassword({ uid, token, new_password }) {
    return request("/api/auth/reset-password/", {
      method: "POST",
      body: { uid, token, new_password },
    });
  },

  /* ----------------------------- Products ----------------------------- */
  products: {
    list() {
      return request("/api/products/");
    },
    get(id) {
      return request(`/api/products/${id}/`);
    },
  },

  /* ------------------------------- Cart ------------------------------- */
  cart: {
    get() {
      return authRequest("/api/cart/");
    },
    add(productId, quantity = 1) {
      return authRequest("/api/cart/add/", {
        method: "POST",
        body: { product_id: productId, quantity },
      });
    },
    remove(productId) {
      return authRequest("/api/cart/remove/", {
        method: "POST",
        body: { product_id: productId },
      });
    },
    increment(productId) {
      return authRequest("/api/cart/add/", {
        method: "POST",
        body: { product_id: productId, quantity: 1 },
      });
    },
    decrement(productId) {
      return authRequest("/api/cart/add/", {
        method: "POST",
        body: { product_id: productId, quantity: -1 },
      });
    },
  },

  /* ------------------------------ Tablets ---------------------------- */
  tablets: {
    list({ brand, search, ordering, page, page_size } = {}) {
      return request(`/api/tablets/${qs({ brand, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/tablets/${id}/`);
    },
  },

  /* --------------------------- Reallaptops ---------------------------- */
  reallaptops: {
    list({ brand, search, ordering, page, page_size } = {}) {
      return request(`/api/reallaptops/${qs({ brand, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/reallaptops/${id}/`);
    },
  },

  /* ---------------------------- Smartphones --------------------------- */
  smartphones: {
    list({ brand, search, ordering, page, page_size } = {}) {
      return request(`/api/smartphones/${qs({ brand, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/smartphones/${id}/`);
    },
  },

  /* ------------------------------ Storages ---------------------------- */
  storages: {
    list({ brand, search, ordering, page, page_size } = {}) {
      return request(`/api/storages/${qs({ brand, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/storages/${id}/`);
    },
  },

  /* --------------------------- Audio Devices --------------------------- */
  audio: {
    list({ brand, category, search, ordering, page, page_size } = {}) {
      return request(`/api/audio-devices/${qs({ brand, category, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/audio-devices/${id}/`);
    },
  },

  /* ----------------------- Mobile Accessories ------------------------- */
  accessories: {
    list({ brand, category, search, ordering, page, page_size } = {}) {
      return request(`/api/mobile-accessories/${qs({ brand, category, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/mobile-accessories/${id}/`);
    },
  },

  /* ----------------------------- Televisions --------------------------- */
  televisions: {
    list({ brand, panel, resolution, min_size, max_size, search, ordering, page, page_size } = {}) {
      return request(
        `/api/televisions/${qs({ brand, panel, resolution, min_size, max_size, search, ordering, page, page_size })}`
      );
    },
    get(id) {
      return request(`/api/televisions/${id}/`);
    },
  },

  // M-KOPA
  mkopa: {
    list({ brand, category, search, ordering, page, page_size } = {}) {
      return request(`/api/mkopa-items/${qs({ brand, category, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/mkopa-items/${id}/`);
    },
  },

  /* --------------------------- Latest Offers --------------------------- */
  latestOffers: {
    list({ brand, label, search, ordering, page, page_size } = {}) {
      return request(`/api/latest-offers/${qs({ brand, label, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/latest-offers/${id}/`);
    },
  },

  /* ---------------------- Budget Smartphones (NEW) --------------------- */
  budgetSmartphones: {
    list({ brand, badge, search, ordering, page, page_size } = {}) {
      return request(`/api/budget-smartphones/${qs({ brand, badge, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/budget-smartphones/${id}/`);
    },
  },

  /* --------------------------- Dial Phones --------------------------- */
  dialPhones: {
    list({ brand, badge, search, ordering, page, page_size } = {}) {
      return request(`/api/dial-phones/${qs({ brand, badge, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/dial-phones/${id}/`);
    },
  },

  /* --------------------------- New iPhones ---------------------------- */
  newIphones: {
    list({ badge, search, ordering, page, page_size } = {}) {
      return request(`/api/new-iphones/${qs({ badge, search, ordering, page, page_size })}`);
    },
    get(id) {
      return request(`/api/new-iphones/${id}/`);
    },
    banner() {
      return request(`/api/new-iphones-banner/`);
    },
  },

  /* ----------------------------- Hero Images ---------------------------- */
  heroes: {
    list() {
      return request("/api/heroes/");
    },
  },

  // CHECKOUT & ORDERS
  checkout: {
    validate() {
      return authRequest("/api/checkout/validate/", { method: "POST" });
    },
    create({ shipping, billing, payment_method }) {
      return authRequest("/api/checkout/", {
        method: "POST",
        body: { shipping, billing, payment_method },
      });
    },
  },
  orders: {
    getById(id) {
      return authRequest(`/api/orders/${id}/`);
    },
    receiptStatus(id) {
      return authRequest(`/api/orders/${id}/receipt/`);
    },
    emailReceipt(id) {
      return authRequest(`/api/orders/${id}/email-receipt/`, { method: "POST" });
    },
    downloadUrl(id) {
      const base = getBaseUrl();
      const prefix = base ? `${base}` : "";
      return `${prefix}/api/orders/${id}/receipt/download/`;
    },
  },

  /* ------------------------------- Search ------------------------------- */
  search: {
    async all(q, { limit = 8 } = {}) {
      const [
        smartphones, tablets, reallaptops, televisions, audio,
        accessories, storages, mkopa, latestOffers,
        budgetSmartphones, dialPhones, newIphones
      ] = await Promise.all([
        api.smartphones.list({ search: q, page_size: limit }),
        api.tablets.list({ search: q, page_size: limit }),
        api.reallaptops.list({ search: q, page_size: limit }),
        api.televisions.list({ search: q, page_size: limit }),
        api.audio.list({ search: q, page_size: limit }),
        api.accessories.list({ search: q, page_size: limit }),
        api.storages.list({ search: q, page_size: limit }),
        api.mkopa.list({ search: q, page_size: limit }).catch(() => []),
        api.latestOffers.list({ search: q, page_size: limit }).catch(() => []),
        api.budgetSmartphones.list({ search: q, page_size: limit }).catch(() => []),
        api.dialPhones.list({ search: q, page_size: limit }).catch(() => []),
        api.newIphones.list({ search: q, page_size: limit }).catch(() => []),
      ]);

      return {
        smartphones, tablets, reallaptops, televisions, audio,
        accessories, storages, mkopa, latestOffers,
        budgetSmartphones, dialPhones, newIphones
      };
    },
  },
};

export default api;

