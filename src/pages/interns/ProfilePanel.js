import React, { useEffect, useRef, useState } from "react";
import { api, authImageUrl, forgetImage, internVerifyUrl } from "../../services/internApi";
import { renderIdCard, downloadIdCardPdf, downloadCanvasPng, preparePhoto } from "../../utils/internIdCard";
import { specLabel } from "../../config/internOptions";
import { fmtDate } from "../../utils/internDates";
import { Alert, Button, Card, Field, inputCls } from "./ui";

export default function ProfilePanel({ me, token, onRefresh, onTokenChange }) {
  const intern = me.intern;
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <IdCardSection intern={intern} batchName={me.batch && me.batch.name} token={token} onRefresh={onRefresh} />
        <DetailsSection intern={intern} batchName={me.batch && me.batch.name} />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <ContactSection intern={intern} token={token} onRefresh={onRefresh} />
        <PasswordSection token={token} onTokenChange={onTokenChange} />
      </div>
    </div>
  );
}

function IdCardSection({ intern, batchName, token, onRefresh }) {
  const photoPath = `/api/interns/photo/${intern.id}`;
  const [cards, setCards] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({});
  const fileRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    let live = true;
    if (!intern.has_photo) {
      setPhotoUrl(null);
      return undefined;
    }
    authImageUrl(photoPath, token, intern.photo_updated_at).then((u) => live && setPhotoUrl(u));
    return () => {
      live = false;
    };
  }, [intern.has_photo, intern.photo_updated_at, photoPath, token]);

  useEffect(() => {
    let live = true;
    if (!photoUrl || !intern.verify_token) {
      setCards(null);
      return undefined;
    }
    renderIdCard({ intern, batchName, photoUrl, verifyUrl: internVerifyUrl(intern.verify_token) }).then((c) => live && setCards(c));
    return () => {
      live = false;
    };
  }, [photoUrl, intern, batchName]);

  // Mount the rendered canvases as previews.
  useEffect(() => {
    for (const [ref, cv] of [
      [frontRef, cards && cards.front],
      [backRef, cards && cards.back],
    ]) {
      if (!ref.current) continue;
      ref.current.innerHTML = "";
      if (cv) {
        cv.style.width = "100%";
        cv.style.height = "auto";
        cv.className = "rounded-xl shadow-lg border border-slate-200";
        ref.current.appendChild(cv);
      }
    }
  }, [cards]);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMsg({});
    try {
      const image = await preparePhoto(file);
      await api("/api/interns/me/photo", { method: "POST", body: { image }, token });
      forgetImage(photoPath);
      await onRefresh();
      setMsg({ kind: "success", text: "Photo updated." });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const base = `IVIS_ID_${intern.intern_code}`;
  return (
    <Card
      title="ID Card"
      actions={
        <Button variant="light" onClick={() => fileRef.current.click()} disabled={busy}>
          {busy ? "Uploading…" : intern.has_photo ? "Change photo" : "Upload photo"}
        </Button>
      }
    >
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
      {!intern.has_photo ? (
        <div className="text-sm text-slate-600 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5">
          Upload a recent passport-style photo (face clearly visible, plain background) to generate your IVIS LABS ID card.
          It will be cropped to a 3:4 portrait.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <div className="text-xs text-center text-slate-400 mb-1">Front</div>
              <div ref={frontRef} />
            </div>
            <div>
              <div className="text-xs text-center text-slate-400 mb-1">Back</div>
              <div ref={backRef} />
            </div>
          </div>
          {!cards && <div className="text-sm text-slate-500 text-center mt-3">Generating card…</div>}
          {cards && (
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <Button onClick={() => downloadIdCardPdf(cards, `${base}.pdf`)}>⬇ Download PDF (print-ready)</Button>
              <Button variant="light" onClick={() => downloadCanvasPng(cards.front, `${base}_front.png`)}>
                Front PNG
              </Button>
              <Button variant="light" onClick={() => downloadCanvasPng(cards.back, `${base}_back.png`)}>
                Back PNG
              </Button>
            </div>
          )}
          <p className="text-xs text-slate-400 text-center mt-3">
            Standard CR80 size (54 × 85.6 mm). The QR code links to your official verification record.
          </p>
        </>
      )}
      {msg.text && <div className="mt-3"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
    </Card>
  );
}

function DetailsSection({ intern, batchName }) {
  const rows = [
    ["Intern ID", intern.intern_code],
    ["Batch", batchName],
    ["Internship", `${fmtDate(intern.start_date)} – ${fmtDate(intern.end_date)} (${intern.duration_label})`],
    ["Email", intern.email],
    ["Date of birth", fmtDate(intern.dob)],
    ["College", intern.college],
    ["University", intern.university],
    ["Degree", intern.degree],
    ["Specialization", specLabel(intern)],
    ["Year of study", intern.year_of_study],
    ["Graduation year", intern.graduation_year],
    ["Area of interest", intern.domain],
  ].filter(([, v]) => v);
  return (
    <Card title="My details">
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-slate-400">{k}</dt>
            <dd className="font-medium text-slate-800 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-slate-400 mt-4">To correct academic or internship details, contact the IVIS LABS team.</p>
    </Card>
  );
}

const CONTACT_FIELDS = [
  ["phone", "Contact number", "tel", true],
  ["whatsapp", "WhatsApp number", "tel"],
  ["city", "City", "text"],
  ["state", "State", "text"],
  ["address", "Address", "textarea"],
  ["emergency_name", "Emergency contact name", "text", true],
  ["emergency_phone", "Emergency contact number", "tel", true],
  ["skills", "Skills", "textarea"],
  ["linkedin", "LinkedIn", "url"],
  ["github", "GitHub / portfolio", "url"],
];

function ContactSection({ intern, token, onRefresh }) {
  const [f, setF] = useState(() => Object.fromEntries(CONTACT_FIELDS.map(([k]) => [k, intern[k] || ""])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({});
    try {
      await api("/api/interns/me", { method: "PUT", body: f, token });
      await onRefresh();
      setMsg({ kind: "success", text: "Saved." });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Contact details">
      <form onSubmit={submit} className="space-y-3">
        {CONTACT_FIELDS.map(([k, label, type, required]) => (
          <Field key={k} label={label} required={required}>
            {type === "textarea" ? (
              <textarea rows={2} className={inputCls} value={f[k]} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
            ) : (
              <input type={type} className={inputCls} value={f[k]} required={required} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
            )}
          </Field>
        ))}
        <Alert kind={msg.kind}>{msg.text}</Alert>
        <Button disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </form>
    </Card>
  );
}

function PasswordSection({ token, onTokenChange }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    setMsg({});
    if (f.next !== f.confirm) return setMsg({ kind: "error", text: "New passwords do not match." });
    setBusy(true);
    try {
      const r = await api("/api/interns/me/password", { method: "POST", body: { current: f.current, next: f.next }, token });
      onTokenChange(r.token);
      setF({ current: "", next: "", confirm: "" });
      setMsg({ kind: "success", text: "Password changed. Other devices have been signed out." });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };
  const input = (k, label) => (
    <Field label={label}>
      <input type="password" className={inputCls} value={f[k]} minLength={k === "current" ? undefined : 8} required onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
    </Field>
  );
  return (
    <Card title="Change password">
      <form onSubmit={submit} className="space-y-3">
        {input("current", "Current password")}
        {input("next", "New password")}
        {input("confirm", "Confirm new password")}
        <Alert kind={msg.kind}>{msg.text}</Alert>
        <Button variant="dark" disabled={busy}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
