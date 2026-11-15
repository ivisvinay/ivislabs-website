/**
 * Shared helpers for the IVIS LABS Worker: CORS, JSON responses, password
 * hashing, signed session tokens and date maths (all dates are IST, YYYY-MM-DD).
 */

export const ALLOWED_ORIGINS = [
  "https://ivislabs.in",
  "https://www.ivislabs.in",
  "https://ivislabs-website.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow =
    ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+\.ivislabs-website\.pages\.dev$/.test(origin)
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return base64ToBytes(b64);
}

const enc = new TextEncoder();

export function randomToken(nBytes = 18) {
  return bytesToB64url(crypto.getRandomValues(new Uint8Array(nBytes)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ---------------- Passwords (PBKDF2-SHA256) ---------------- */

const PBKDF2_ITER = 100000; // Workers' maximum

export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? b64urlToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITER },
    key,
    256
  );
  return { hash: bytesToB64url(bits), salt: bytesToB64url(salt) };
}

export async function verifyPassword(password, saltB64, hashB64) {
  const { hash } = await hashPassword(password, saltB64);
  return safeEqual(hash, hashB64);
}

/* ---------------- Session tokens (HMAC-signed) ---------------- */

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

function requireSecret(env) {
  if (!env.SESSION_SECRET) throw new HttpError(500, "Server not configured (SESSION_SECRET missing)");
  return env.SESSION_SECRET;
}

export async function signToken(env, payload, ttlSeconds) {
  const body = bytesToB64url(
    enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
  );
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(requireSecret(env)), enc.encode(body));
  return `${body}.${bytesToB64url(sig)}`;
}

export async function verifyToken(env, token) {
  if (!token || typeof token !== "string" || token.indexOf(".") < 0) return null;
  const [body, sig] = token.split(".");
  const expected = await crypto.subtle.sign("HMAC", await hmacKey(requireSecret(env)), enc.encode(body));
  if (!safeEqual(bytesToB64url(expected), sig || "")) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

export function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

/* ---------------- Admin auth ---------------- */

/** ADMIN_USERS secret: JSON array of {username, password}. */
function adminUsers(env) {
  try {
    const list = JSON.parse(env.ADMIN_USERS || "[]");
    return Array.isArray(list) ? list.filter((u) => u && u.username && u.password) : [];
  } catch (_) {
    return [];
  }
}

export async function adminLogin(env, username, password) {
  const u = adminUsers(env).find((x) => x.username === String(username || "").trim());
  if (!u || !safeEqual(String(u.password), String(password || ""))) return null;
  const token = await signToken(env, { sub: u.username, role: "admin" }, 12 * 3600);
  return { token, username: u.username };
}

/** Returns the admin username for a valid admin bearer token, else null. */
export async function adminFromToken(request, env) {
  const p = await verifyToken(env, bearer(request));
  if (!p || p.role !== "admin") return null;
  // Removing a user from ADMIN_USERS revokes their open sessions too.
  if (!adminUsers(env).some((u) => u.username === p.sub)) return null;
  return p.sub;
}

/* ---------------- Dates (IST) ---------------- */

export function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function isISODate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

export function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** End date (inclusive) of an internship of `months` starting on `startIso`. */
export function endDateFor(startIso, months) {
  // Same day-of-month `months` later, minus one day (Jan 31 + 3m → Apr 30).
  // Overflow rolls forward, so the internship is never shorter than promised.
  const d = new Date(startIso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function weekday(iso) {
  return new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = Sunday
}

export function nowISO() {
  return new Date().toISOString();
}

/* ---------------- HTML pages ---------------- */

export function htmlResponse(html, status) {
  return new Response(html, {
    status: status || 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export function pageShell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · IVIS LABS Verification</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;color:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#fff;max-width:560px;width:100%;border-radius:16px;box-shadow:0 10px 40px rgba(2,6,23,.12);overflow:hidden}
  .bar{padding:14px 24px;color:#fff;font-weight:700;letter-spacing:.3px;display:flex;align-items:center;gap:10px}
  .ok{background:#16a34a}.bad{background:#dc2626}
  .body{padding:24px 28px}
  h1{font-size:20px;margin:0 0 4px}
  .muted{color:#64748b;font-size:14px}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:15px}
  td{padding:9px 0;border-bottom:1px solid #eef2f7;vertical-align:top}
  td.k{color:#64748b;width:150px;font-size:13px;text-transform:uppercase;letter-spacing:.4px}
  .btn{display:inline-block;margin-top:20px;background:#2563eb;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:600;font-size:14px}
  .brand{padding:16px 28px;border-top:1px solid #eef2f7;font-size:12px;color:#94a3b8;display:flex;justify-content:space-between}
  code{background:#f1f5f9;padding:2px 6px;border-radius:6px;font-size:12px}
</style></head><body><div class="card">${body}
<div class="brand"><span>IVIS LABS · Document Verification</span><span>ivislabs.in</span></div>
</div></body></html>`;
}

