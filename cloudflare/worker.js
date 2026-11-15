/**
 * IVIS LABS – Certificate / Document verification Worker
 *
 * Bindings (set at deploy time):
 *   CERTS          -> R2 bucket "ivislabs-certificates" (documents + intern photos)
 *   DB             -> D1 database "ivislabs-interns" (intern portal)
 *   CHAT           -> Durable Object namespace (ChatHub, real-time chat)
 *   ADMIN_USERS    -> secret: JSON [{"username","password"}] for /api/admin/login
 *   SESSION_SECRET -> secret: HMAC key for admin + intern session tokens
 *   ADMIN_PASS     -> (legacy, optional) shared X-Admin-Key for document issuing
 *
 * Intern portal routes live in interns.js; this file keeps document issuing.
 *
 * R2 layout:
 *   records/<id>.json    metadata about an issued document
 *   documents/<id>.pdf   the issued PDF itself
 *
 * Public verification is read-only; issuing requires the admin password.
 */

import {
  corsHeaders,
  json,
  esc,
  base64ToBytes,
  HttpError,
  adminFromToken,
  pageShell,
  htmlResponse,
} from "./lib.js";
import { handleInterns } from "./interns.js";

export { ChatHub } from "./chatHub.js";

const DOC_LABELS = {
  offer: "Internship Offer Letter",
  completion: "Internship Completion Certificate",
  performance: "Performance Award Certificate",
};

/**
 * Valid keys accepted as X-Admin-Key. Supports a single ADMIN_PASS and/or a
 * comma-separated ADMIN_KEYS (for per-user Worker keys, if ever wanted).
 */
function validKeys(env) {
  const keys = [];
  if (env.ADMIN_KEYS) {
    for (const k of env.ADMIN_KEYS.split(",")) {
      const t = k.trim();
      if (t) keys.push(t);
    }
  }
  if (env.ADMIN_PASS) keys.push(env.ADMIN_PASS);
  return keys;
}

/**
 * Admin auth for the document endpoints. Prefers a signed admin session token
 * (Authorization: Bearer, from /api/admin/login). The old shared X-Admin-Key is
 * still accepted only while ADMIN_PASS / ADMIN_KEYS secrets are set — remove
 * those secrets to switch it off.
 */
async function authorizedAdmin(request, env) {
  const fromToken = await adminFromToken(request, env);
  if (fromToken) return fromToken;
  const key = request.headers.get("X-Admin-Key") || "";
  const keys = validKeys(env);
  return keys.length > 0 && keys.includes(key) ? "legacy-key" : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    try {
      // ---- Intern portal, chat and admin login ----
      const portal = await handleInterns(request, env, ctx, url, path);
      if (portal) return portal;

      // ---- Issue a new document (admin only) ----
      if (path === "/api/issue" && request.method === "POST") {
        const admin = await authorizedAdmin(request, env);
        if (!admin) {
          return json({ ok: false, error: "Unauthorized" }, 401, request);
        }
        const body = await request.json();
        const { id, type, recipient, pdfBase64, meta, issuer } = body || {};
        if (!id || !type || !recipient || !pdfBase64) {
          return json({ ok: false, error: "Missing fields" }, 400, request);
        }
        if (!DOC_LABELS[type]) {
          return json({ ok: false, error: "Unknown document type" }, 400, request);
        }
        // Prevent silent overwrite of an existing verification id.
        const existing = await env.CERTS.get(`records/${id}.json`);
        if (existing) {
          return json({ ok: false, error: "Document id already exists" }, 409, request);
        }

        const pdfBytes = base64ToBytes(pdfBase64);
        await env.CERTS.put(`documents/${id}.pdf`, pdfBytes, {
          httpMetadata: { contentType: "application/pdf" },
        });

        const record = {
          id,
          type,
          typeLabel: DOC_LABELS[type],
          recipient,
          meta: meta || {},
          issuedAt: new Date().toISOString(),
          issuer:
            admin !== "legacy-key" ? admin : (issuer && String(issuer).slice(0, 80)) || env.ADMIN_USER || "admin",
        };
        await env.CERTS.put(`records/${id}.json`, JSON.stringify(record), {
          httpMetadata: { contentType: "application/json" },
        });

        return json(
          { ok: true, id, verifyUrl: `${url.origin}/verify/${id}` },
          200,
          request
        );
      }

      // ---- List issued documents (admin only) ----
      if (path === "/api/documents" && request.method === "GET") {
        if (!(await authorizedAdmin(request, env))) {
          return json({ ok: false, error: "Unauthorized" }, 401, request);
        }
        const list = await env.CERTS.list({ prefix: "records/", limit: 1000 });
        const docs = [];
        for (const obj of list.objects) {
          const r = await env.CERTS.get(obj.key);
          if (r) docs.push(await r.json());
        }
        docs.sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
        return json({ ok: true, documents: docs }, 200, request);
      }

      // ---- Serve stored PDF (public) ----
      if (path.startsWith("/document/") && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/document/".length)).replace(/\.pdf$/, "");
        const obj = await env.CERTS.get(`documents/${id}.pdf`);
        if (!obj) return new Response("Not found", { status: 404, headers: corsHeaders(request) });
        return new Response(obj.body, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${id}.pdf"`,
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders(request),
          },
        });
      }

      // ---- Verification page (public) ----
      if (path.startsWith("/verify/") && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/verify/".length));
        const rec = await env.CERTS.get(`records/${id}.json`);
        if (!rec) return htmlNotFound(id);
        const record = await rec.json();
        return htmlVerified(record, url.origin);
      }

      // ---- API-style verify (public, JSON) ----
      if (path.startsWith("/api/verify/") && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/api/verify/".length));
        const rec = await env.CERTS.get(`records/${id}.json`);
        if (!rec) return json({ ok: true, valid: false, id }, 200, request);
        return json({ ok: true, valid: true, record: await rec.json() }, 200, request);
      }

      if (path === "/" || path === "/health") {
        return json({ ok: true, service: "ivislabs-certificates" }, 200, request);
      }

      return new Response("Not found", { status: 404, headers: corsHeaders(request) });
    } catch (err) {
      if (err instanceof HttpError) return json({ ok: false, error: err.message }, err.status, request);
      console.error(err);
      return json({ ok: false, error: "Server error" }, 500, request);
    }
  },
};

function htmlVerified(r, origin) {
  const m = r.meta || {};
  const rows = [
    ["Document", r.typeLabel],
    ["Recipient", r.recipient],
    ["Role / Program", m.role],
    ["Duration", m.duration || (m.startDate && m.endDate ? `${m.startDate} to ${m.endDate}` : "")],
    ["Award", m.award],
    ["Issue date", m.issueDate],
    ["Verification ID", r.id],
    ["Registered on", new Date(r.issuedAt).toUTCString()],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join("");
  return htmlResponse(pageShell(
    "Verified",
    `<div class="bar ok">✔ Genuine document</div>
     <div class="body">
       <h1>This document is authentic</h1>
       <div class="muted">Issued and registered by IVIS LABS. The details below are the official record.</div>
       <table>${rows}</table>
       <a class="btn" href="${origin}/document/${encodeURIComponent(r.id)}.pdf" target="_blank" rel="noopener">View original PDF</a>
     </div>`
  ));
}

function htmlNotFound(id) {
  return htmlResponse(
    pageShell(
      "Not found",
      `<div class="bar bad">✕ Not verified</div>
       <div class="body">
         <h1>No matching document</h1>
         <div class="muted">We could not find a document with verification ID <code>${esc(id)}</code> in the IVIS LABS registry. This document may be forged, altered, or the code was mistyped.</div>
       </div>`
    ),
    404
  );
}
