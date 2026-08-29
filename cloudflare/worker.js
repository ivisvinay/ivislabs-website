/**
 * IVIS LABS – Certificate / Document verification Worker
 *
 * Bindings (set at deploy time):
 *   CERTS       -> R2 bucket "ivislabs-certificates"
 *   ADMIN_USER  -> secret text (admin username)
 *   ADMIN_PASS  -> secret text (admin password) — required to ISSUE documents
 *
 * R2 layout:
 *   records/<id>.json    metadata about an issued document
 *   documents/<id>.pdf   the issued PDF itself
 *
 * Public verification is read-only; issuing requires the admin password.
 */

const ALLOWED_ORIGINS = [
  "https://ivislabs.in",
  "https://www.ivislabs.in",
  "https://ivislabs-website.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DOC_LABELS = {
  offer: "Internship Offer Letter",
  completion: "Internship Completion Certificate",
  performance: "Performance Award Certificate",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    try {
      // ---- Issue a new document (admin only) ----
      if (path === "/api/issue" && request.method === "POST") {
        const key = request.headers.get("X-Admin-Key") || "";
        if (!env.ADMIN_PASS || key !== env.ADMIN_PASS) {
          return json({ ok: false, error: "Unauthorized" }, 401, request);
        }
        const body = await request.json();
        const { id, type, recipient, pdfBase64, meta } = body || {};
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
          issuer: env.ADMIN_USER || "admin",
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
        const key = request.headers.get("X-Admin-Key") || "";
        if (!env.ADMIN_PASS || key !== env.ADMIN_PASS) {
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
      return json({ ok: false, error: String(err && err.message || err) }, 500, request);
    }
  },
};

function htmlResponse(html, status) {
  return new Response(html, {
    status: status || 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function pageShell(title, body) {
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
