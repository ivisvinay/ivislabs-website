import React, { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import adminAuth from "../config/adminAuth.json";
import { DOC_TYPES, generateDocument } from "../utils/certificatePdf";

const API = process.env.REACT_APP_CERT_API || "";
const SS_KEY = "ivis_admin_user";

const todayISO = () => new Date().toISOString().slice(0, 10);

const uuid = () =>
  (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const DOC_LABEL = (t) => (DOC_TYPES.find((d) => d.key === t) || {}).label || t;

// Support both the multi-user shape ({ apiKey, users: [...] }) and the older
// single-object shape ({ username, password }).
const USERS =
  (Array.isArray(adminAuth.users) && adminAuth.users) ||
  (adminAuth.username
    ? [{ username: adminAuth.username, password: adminAuth.password }]
    : []);

// The key the browser sends to the Worker to authorise issuing. A shared
// apiKey keeps the user list (login gate) decoupled from the Worker secret,
// so adding a user is just editing this JSON — no Worker redeploy.
const API_KEY =
  adminAuth.apiKey ||
  (USERS[0] && USERS[0].password) ||
  adminAuth.password ||
  "";

/* ------------------------------------------------------------------ */
/* Login screen                                                        */
/* ------------------------------------------------------------------ */
function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const match = USERS.find(
      (x) => x.username === u.trim() && x.password === p
    );
    if (match) {
      setErr("");
      onLogin(match.username);
    } else {
      setErr("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-slate-900">IVIS LABS</div>
          <div className="text-sm text-slate-500">Document Admin Console</div>
        </div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">USERNAME</label>
        <input
          className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={u}
          onChange={(e) => setU(e.target.value)}
          autoFocus
        />
        <label className="block text-xs font-semibold text-slate-500 mb-1">PASSWORD</label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition">
          Sign in
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form field definitions per document type                            */
/* ------------------------------------------------------------------ */
const FIELDS = {
  offer: [
    { key: "recipient", label: "Recipient full name", required: true },
    { key: "role", label: "Internship role / position", required: true },
    { key: "location", label: "Work location", placeholder: "Mysuru, India" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "stipend", label: "Stipend (optional)", placeholder: "₹10,000 / month" },
    { key: "issueDate", label: "Issue date", type: "date", required: true },
  ],
  completion: [
    { key: "recipient", label: "Recipient full name", required: true },
    { key: "role", label: "Internship role / position", required: true },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "performance", label: "Performance rating (optional)", placeholder: "Excellent" },
    { key: "issueDate", label: "Issue date", type: "date", required: true },
  ],
  performance: [
    { key: "recipient", label: "Recipient full name", required: true },
    { key: "role", label: "Role during internship", required: true },
    { key: "award", label: "Award title", placeholder: "Intern of the Year", required: true },
    { key: "reason", label: "Citation / reason (optional)", type: "textarea" },
    { key: "issueDate", label: "Issue date", type: "date", required: true },
  ],
};

/* ------------------------------------------------------------------ */
/* Shared issue helper (used by the single form and the bulk uploader) */
/* ------------------------------------------------------------------ */
async function issueDocument({ type, data, seal, username }) {
  const id = uuid();
  const verifyUrl = `${API}/verify/${id}`;
  const { blob, base64, filename } = await generateDocument({
    type,
    id,
    verifyUrl,
    data,
    sealDataUrl: seal && seal.url,
    sealAspect: seal && seal.aspect,
  });
  const { recipient, ...meta } = data;
  const res = await fetch(`${API}/api/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": API_KEY },
    body: JSON.stringify({ id, type, recipient, pdfBase64: base64, meta, issuer: username }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || `Server error (${res.status})`);
  return { id, verifyUrl, blob, filename, recipient };
}

/* ------------------------------------------------------------------ */
/* Excel helpers                                                       */
/* ------------------------------------------------------------------ */

// Excel (1900 system) serial number -> YYYY-MM-DD, computed in UTC so it is
// independent of the browser's timezone (SheetJS' own Date conversion is not).
function excelSerialToISO(n) {
  const ms = Math.round((n - 25569) * 86400000);
  return new Date(ms).toISOString().slice(0, 10);
}

// Accepts a Date, Excel serial number, or string; returns YYYY-MM-DD
// (DD/MM/YYYY assumed for slash/dash strings).
function normalizeDate(v) {
  if (v == null || v === "") return "";
  if (typeof v === "number" && isFinite(v)) return excelSerialToISO(v);
  if (v instanceof Date) return excelSerialToISO(v.getTime() / 86400000 + 25569);
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    let [, a, b, c] = m;
    if (c.length === 2) c = "20" + c;
    return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  return s;
}

const TYPE_ALIASES = {
  offer: "offer",
  "offer letter": "offer",
  "internship offer letter": "offer",
  completion: "completion",
  "completion certificate": "completion",
  "internship completion certificate": "completion",
  performance: "performance",
  award: "performance",
  "performance award": "performance",
  "performance award certificate": "performance",
};

function resolveRowType(lowerRow, defaultType) {
  const raw = lowerRow["type"] ?? lowerRow["document"] ?? lowerRow["doctype"];
  if (raw) {
    const key = TYPE_ALIASES[String(raw).trim().toLowerCase()];
    if (key) return key;
  }
  return defaultType;
}

// Turn a raw sheet row into { type, data, error } using the field map.
function parseRow(rawRow, defaultType) {
  const lower = {};
  Object.keys(rawRow).forEach((k) => {
    lower[k.trim().toLowerCase()] = rawRow[k];
  });

  const type = resolveRowType(lower, defaultType);
  const fields = FIELDS[type] || [];
  const data = {};

  for (const f of fields) {
    const label = f.label.replace(/\s*\(optional\)/i, "").trim().toLowerCase();
    let v = lower[f.key.toLowerCase()];
    if (v === undefined) v = lower[label];
    if (f.type === "date") v = normalizeDate(v);
    else v = v == null ? "" : String(v).trim();
    if (v) data[f.key] = v;
  }
  if (!data.issueDate) data.issueDate = todayISO();

  const missing = fields
    .filter((f) => f.required && !data[f.key])
    .map((f) => f.label.replace(/\s*\(optional\)/i, "").trim());

  return { type, data, error: missing.length ? `Missing: ${missing.join(", ")}` : "" };
}

// Build & download a fillable .xlsx template for a document type.
function downloadTemplate(type) {
  const example = {
    offer: {
      recipient: "Jane Doe",
      role: "AI Intern",
      location: "Mysuru, India",
      startDate: "2026-08-01",
      endDate: "2026-10-31",
      stipend: "10,000/- per month",
      issueDate: todayISO(),
    },
    completion: {
      recipient: "Jane Doe",
      role: "AI Intern",
      startDate: "2026-08-01",
      endDate: "2026-10-31",
      performance: "Excellent",
      issueDate: todayISO(),
    },
    performance: {
      recipient: "Jane Doe",
      role: "AI Intern",
      award: "Intern of the Year",
      reason: "For outstanding contribution to the team.",
      issueDate: todayISO(),
    },
  }[type];

  // Header order follows FIELDS; keep an example row so users can just edit it.
  const headers = FIELDS[type].map((f) => f.key);
  const ws = XLSX.utils.json_to_sheet([example], { header: headers });
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "records");
  XLSX.writeFile(wb, `ivislabs_${type}_template.xlsx`);
}

/* ------------------------------------------------------------------ */
/* Bulk uploader (Excel -> issue all -> download ZIP of PDFs)          */
/* ------------------------------------------------------------------ */
function BulkPanel({ type, seal, username, onIssued }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [zip, setZip] = useState(null); // { url, name }
  const fileRef = useRef(null);

  const reset = () => {
    setRows([]);
    setFileName("");
    setParseError("");
    setResults(null);
    if (zip) URL.revokeObjectURL(zip.url);
    setZip(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setParseError("");
    setResults(null);
    setZip(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      // Read raw values (date cells come back as serial numbers, which we
      // convert in a timezone-safe way; see normalizeDate).
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
      if (!raw.length) {
        setRows([]);
        setParseError("No rows found in the first sheet.");
        return;
      }
      setRows(raw.map((r) => parseRow(r, type)));
    } catch (err) {
      setParseError("Could not read the file: " + (err.message || err));
      setRows([]);
    }
  };

  const valid = rows.filter((r) => !r.error);

  const runBulk = async () => {
    if (!valid.length) return;
    setRunning(true);
    setResults(null);
    setProgress({ done: 0, total: valid.length });

    const zipper = new JSZip();
    const out = [];
    const manifest = [
      ["recipient", "document", "verification_id", "verify_url", "status"],
    ];
    const usedNames = {};

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        const r = await issueDocument({ type: row.type, data: row.data, seal, username });
        let name = r.filename;
        if (usedNames[name]) name = name.replace(/\.pdf$/, `_${usedNames[name] + 1}.pdf`);
        usedNames[r.filename] = (usedNames[r.filename] || 0) + 1;
        zipper.file(name, r.blob);
        out.push({ ok: true, recipient: r.recipient, type: row.type, id: r.id, verifyUrl: r.verifyUrl });
        manifest.push([r.recipient, DOC_LABEL(row.type), r.id, r.verifyUrl, "issued"]);
      } catch (err) {
        out.push({ ok: false, recipient: row.data.recipient || `Row ${i + 1}`, type: row.type, error: err.message || String(err) });
        manifest.push([row.data.recipient || `Row ${i + 1}`, DOC_LABEL(row.type), "", "", "FAILED: " + (err.message || err)]);
      }
      setProgress({ done: i + 1, total: valid.length });
    }

    const csv = manifest.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    zipper.file("manifest.csv", csv);

    const blob = await zipper.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const name = `ivislabs_${type}_documents_${todayISO()}.zip`;
    setZip({ url, name });

    // Trigger the download automatically.
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setResults(out);
    setRunning(false);
    onIssued && onIssued();
  };

  const okCount = results ? results.filter((r) => r.ok).length : 0;
  const failCount = results ? results.length - okCount : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-900">Bulk issue from Excel</h2>
        <button
          type="button"
          onClick={() => downloadTemplate(type)}
          className="text-sm text-blue-600 hover:underline"
        >
          ⬇ Download {DOC_LABEL(type)} template
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Download the template, fill one row per recipient, then upload it. Every
        row is generated for <span className="font-medium">{DOC_LABEL(type)}</span>,
        registered with its own QR code, and bundled into a single ZIP.
        (Add a <code className="bg-slate-100 px-1 rounded">type</code> column to
        mix document types in one sheet.)
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          disabled={running}
          className="text-sm"
        />
        {rows.length > 0 && (
          <button
            type="button"
            onClick={reset}
            disabled={running}
            className="text-xs text-slate-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {parseError && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {parseError}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-slate-600 mb-2">
            <span className="font-medium">{fileName}</span> — {valid.length} ready
            {rows.length - valid.length > 0 && (
              <span className="text-red-600"> · {rows.length - valid.length} with errors</span>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="text-left px-2 py-1.5">#</th>
                  <th className="text-left px-2 py-1.5">Recipient</th>
                  <th className="text-left px-2 py-1.5">Type</th>
                  <th className="text-left px-2 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                    <td className="px-2 py-1.5">{r.data.recipient || "—"}</td>
                    <td className="px-2 py-1.5 text-slate-500">{DOC_LABEL(r.type)}</td>
                    <td className="px-2 py-1.5">
                      {r.error ? (
                        <span className="text-red-600">{r.error}</span>
                      ) : (
                        <span className="text-green-600">ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={runBulk}
            disabled={running || !valid.length}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            {running
              ? `Issuing ${progress.done}/${progress.total}…`
              : `Generate & Issue ${valid.length} document${valid.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {results && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="font-semibold text-green-800">
            ✔ {okCount} issued{failCount ? ` · ${failCount} failed` : ""}
          </div>
          <div className="text-sm text-slate-600 mt-1">
            ZIP downloaded (PDFs + manifest.csv).
          </div>
          {zip && (
            <a
              href={zip.url}
              download={zip.name}
              className="inline-block mt-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg"
            >
              ⬇ Download ZIP again
            </a>
          )}
          {failCount > 0 && (
            <ul className="mt-3 text-xs text-red-700 list-disc pl-5">
              {results
                .filter((r) => !r.ok)
                .map((r, i) => (
                  <li key={i}>
                    {r.recipient}: {r.error}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main console                                                        */
/* ------------------------------------------------------------------ */
function Console({ username, onLogout }) {
  const [type, setType] = useState("offer");
  const [form, setForm] = useState({ issueDate: todayISO() });
  const [seal, setSeal] = useState({ url: null, aspect: 2 });
  const [sealMsg, setSealMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);

  // Load the seal image placed at /public/seal.png
  const loadSeal = useCallback((src) => {
    const img = new Image();
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight || 2;
      // Downscale the seal to a sensible print resolution so embedded PDFs stay
      // small (the seal prints at ~34mm, so ~600px on the long side is plenty).
      let url = src;
      const maxDim = 600;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      if (scale < 1) {
        try {
          const w = Math.round(img.naturalWidth * scale);
          const h = Math.round(img.naturalHeight * scale);
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          url = c.toDataURL("image/png");
        } catch (_) {
          url = src; // tainted canvas or unsupported — use the original
        }
      }
      setSeal({ url, aspect });
      setSealMsg("");
    };
    img.onerror = () =>
      setSealMsg(
        "seal.png not found in /public. Place your seal+signature image there, or upload one below to test."
      );
    img.src = src;
  }, []);

  useEffect(() => {
    loadSeal(`${process.env.PUBLIC_URL || ""}/seal.png`);
  }, [loadSeal]);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/documents`, {
        headers: { "X-Admin-Key": API_KEY },
      });
      const j = await res.json();
      if (j.ok) setDocs(j.documents);
    } catch (_) {
      /* ignore listing errors */
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const onSealFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadSeal(reader.result);
    reader.readAsDataURL(file);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const changeType = (t) => {
    setType(t);
    setResult(null);
    setError("");
    setForm({ issueDate: todayISO() });
  };

  const issue = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const fields = FIELDS[type];
    for (const f of fields) {
      if (f.required && !form[f.key]) {
        setError(`Please fill in: ${f.label}`);
        return;
      }
    }

    setBusy(true);
    try {
      const { id, verifyUrl, blob, filename, recipient } = await issueDocument({
        type,
        data: form,
        seal,
        username,
      });
      const downloadUrl = URL.createObjectURL(blob);
      setResult({ id, verifyUrl, downloadUrl, filename, recipient });
      fetchDocs();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const label = DOC_TYPES.find((d) => d.key === type)?.label;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <div className="font-bold leading-tight">IVIS LABS · Document Admin</div>
            <div className="text-xs text-slate-400">
              Issue & register verifiable documents
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 hidden sm:inline">
              Signed in as <span className="font-semibold text-white">{username}</span>
            </span>
            <button
              onClick={onLogout}
              className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8 grid md:grid-cols-3 gap-6">
        {/* Form column */}
        <div className="md:col-span-2 space-y-6">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map((d) => (
              <button
                key={d.key}
                onClick={() => changeType(d.key)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition ${
                  type === d.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={issue}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <h2 className="font-semibold text-slate-900 mb-4">{label}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {FIELDS[type].map((f) => (
                <div
                  key={f.key}
                  className={f.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {f.label.toUpperCase()}
                    {f.required && <span className="text-red-500"> *</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={f.type || "text"}
                      placeholder={f.placeholder || ""}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {busy ? "Generating & registering…" : "Generate & Issue Document"}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="font-semibold text-green-800 mb-2">
                ✔ Document issued for {result.recipient}
              </div>
              <div className="text-sm text-slate-600 mb-3">
                Registered in R2 and verifiable via the QR code embedded in the PDF.
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={result.downloadUrl}
                  download={result.filename}
                  className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg"
                >
                  ⬇ Download PDF
                </a>
                <a
                  href={result.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-slate-300 text-sm px-4 py-2 rounded-lg text-blue-700"
                >
                  🔗 Open verification page
                </a>
              </div>
              <div className="text-xs text-slate-500 mt-3 break-all">
                Verification ID: {result.id}
              </div>
            </div>
          )}

          {/* Bulk uploader */}
          <BulkPanel type={type} seal={seal} username={username} onIssued={fetchDocs} />
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Seal */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="font-semibold text-slate-900 mb-3 text-sm">
              Seal & Signature
            </div>
            {seal.url ? (
              <img
                src={seal.url}
                alt="seal and signature"
                className="max-h-24 mx-auto object-contain"
              />
            ) : (
              <div className="text-xs text-amber-600 mb-3">{sealMsg}</div>
            )}
            <label className="block mt-3 text-xs text-slate-500">
              Override for this session:
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={onSealFile}
                className="block mt-1 text-xs"
              />
            </label>
          </div>

          {/* Recently issued */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-900 text-sm">Recently issued</div>
              <button
                onClick={fetchDocs}
                className="text-xs text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>
            {docs.length === 0 ? (
              <div className="text-xs text-slate-400">No documents yet.</div>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {docs.map((d) => (
                  <li key={d.id} className="text-xs border-b border-slate-100 pb-2">
                    <div className="font-medium text-slate-800">{d.recipient}</div>
                    <div className="text-slate-500">{d.typeLabel}</div>
                    <a
                      href={`${API}/verify/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      verify ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function Admin() {
  const [username, setUsername] = useState(() => {
    try {
      return sessionStorage.getItem(SS_KEY) || "";
    } catch (_) {
      return "";
    }
  });

  useEffect(() => {
    document.title = "IVIS LABS · Admin";
  }, []);

  const login = (name) => {
    try {
      sessionStorage.setItem(SS_KEY, name);
    } catch (_) {
      /* ignore */
    }
    setUsername(name);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(SS_KEY);
    } catch (_) {
      /* ignore */
    }
    setUsername("");
  };

  if (!username) return <Login onLogin={login} />;
  return <Console username={username} onLogout={logout} />;
}
