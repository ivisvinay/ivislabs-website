import React, { useCallback, useEffect, useState } from "react";
import adminAuth from "../config/adminAuth.json";
import { DOC_TYPES, generateDocument } from "../utils/certificatePdf";

const API = process.env.REACT_APP_CERT_API || "";
const SS_KEY = "ivis_admin_key";

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/* Login screen                                                        */
/* ------------------------------------------------------------------ */
function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (u === adminAuth.username && p === adminAuth.password) {
      setErr("");
      onLogin(p);
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
/* Main console                                                        */
/* ------------------------------------------------------------------ */
function Console({ adminKey, onLogout }) {
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
      setSeal({ url: src, aspect: img.naturalWidth / img.naturalHeight || 2 });
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
        headers: { "X-Admin-Key": adminKey },
      });
      const j = await res.json();
      if (j.ok) setDocs(j.documents);
    } catch (_) {
      /* ignore listing errors */
    }
  }, [adminKey]);

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
      const id =
        (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const verifyUrl = `${API}/verify/${id}`;

      const { blob, base64, filename } = await generateDocument({
        type,
        id,
        verifyUrl,
        data: form,
        sealDataUrl: seal.url,
        sealAspect: seal.aspect,
      });

      const { recipient, ...meta } = form;
      const res = await fetch(`${API}/api/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify({ id, type, recipient, pdfBase64: base64, meta }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `Server error (${res.status})`);

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
          <button
            onClick={onLogout}
            className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg"
          >
            Sign out
          </button>
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
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return sessionStorage.getItem(SS_KEY) || "";
    } catch (_) {
      return "";
    }
  });

  useEffect(() => {
    document.title = "IVIS LABS · Admin";
  }, []);

  const login = (key) => {
    try {
      sessionStorage.setItem(SS_KEY, key);
    } catch (_) {
      /* ignore */
    }
    setAdminKey(key);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(SS_KEY);
    } catch (_) {
      /* ignore */
    }
    setAdminKey("");
  };

  if (!adminKey) return <Login onLogin={login} />;
  return <Console adminKey={adminKey} onLogout={logout} />;
}
