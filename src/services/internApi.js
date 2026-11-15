// Thin client for the intern-portal endpoints on the IVIS LABS Worker.
export const API = process.env.REACT_APP_CERT_API || "";

const TOKEN_KEY = "ivis_intern_token";

export const internToken = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  },
  set(t) {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch (_) {
      /* private mode: session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {
      /* ignore */
    }
  },
};

/** JSON request; throws Error(message) with `.status` on failure. */
export async function api(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (_) {
    const e = new Error("Network error — check your connection and try again.");
    e.status = 0;
    throw e;
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) {
    const e = new Error(j.error || `Request failed (${res.status})`);
    e.status = res.status;
    throw e;
  }
  return j;
}

/** Fetch an authenticated image and return an object URL (or null). */
const imageCache = new Map();
export function authImageUrl(path, token, version = "") {
  const key = `${path}|${version}`;
  if (!imageCache.has(key)) {
    imageCache.set(
      key,
      fetch(API + path, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => (b ? URL.createObjectURL(b) : null))
        .catch(() => null)
    );
  }
  return imageCache.get(key);
}
export function forgetImage(path) {
  for (const k of [...imageCache.keys()]) if (k.startsWith(path + "|")) imageCache.delete(k);
}

export function chatSocketUrl(token) {
  const base = API || window.location.origin;
  return `${base.replace(/^http/, "ws")}/api/chat/ws?token=${encodeURIComponent(token)}`;
}

export const internVerifyUrl = (verifyToken) => `${API}/intern-id/${verifyToken}`;
