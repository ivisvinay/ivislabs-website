import React, { useEffect, useRef, useState } from "react";
import { authImageUrl, internVerifyUrl } from "../../services/internApi";
import { renderIdCard, downloadIdCardPdf, downloadCanvasPng, downloadIdCardsSheetPdf } from "../../utils/internIdCard";
import { fmtDate } from "../../utils/internDates";
import { Alert, Avatar, Button, Card, inputCls } from "../interns/ui";

// Rendered cards, kept across tab switches: key -> Promise<{front, back, thumb}>
const cardCache = new Map();

function cardFor(intern, token) {
  const key = `${intern.id}|${intern.photo_updated_at}|${intern.batch_name}|${intern.start_date}|${intern.end_date}`;
  if (!cardCache.has(key)) {
    const p = (async () => {
      const photoUrl = await authImageUrl(`/api/admin/interns/${intern.id}/photo`, token, intern.photo_updated_at);
      const cards = await renderIdCard({ intern, batchName: intern.batch_name, photoUrl, verifyUrl: internVerifyUrl(intern.verify_token) });
      return { ...cards, thumb: cards.front.toDataURL("image/jpeg", 0.8) };
    })();
    p.catch(() => cardCache.delete(key));
    cardCache.set(key, p);
  }
  return cardCache.get(key);
}

const hasCard = (i) => i.has_photo && i.verify_token;

/** Admin › ID cards: every approved intern's card, viewable and downloadable. */
export default function AdminIdCards({ interns, batches, token, onOpenIntern, onMessage }) {
  const [batchId, setBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const q = search.trim().toLowerCase();
  const list = (interns || []).filter(
    (i) =>
      i.status === "approved" &&
      (!batchId || String(i.batch_id) === batchId) &&
      (!q || [i.full_name, i.intern_code, i.college].some((v) => v && String(v).toLowerCase().includes(q)))
  );
  const ready = list.filter(hasCard);
  const noPhoto = list.filter((i) => !hasCard(i));

  const downloadAll = async () => {
    setErr("");
    try {
      const all = [];
      for (let n = 0; n < ready.length; n++) {
        setBusy(`Preparing ${n + 1} / ${ready.length}…`);
        all.push(await cardFor(ready[n], token));
      }
      setBusy("Building PDF…");
      const b = batches.find((x) => String(x.id) === batchId);
      downloadIdCardsSheetPdf(all, `IVIS_ID_cards_${b ? b.name.replace(/[^\w-]+/g, "_") : "all"}.pdf`);
    } catch (e) {
      setErr(e.message || "Could not build the PDF");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Batch</div>
            <select className={`${inputCls} w-48`} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              <option value="">All batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="text-xs text-slate-500 mb-1">Search</div>
            <input className={inputCls} placeholder="Name, intern ID or college" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={downloadAll} disabled={!!busy || !ready.length} title="A4 sheets, 9 cards per page, fronts then backs (for double-sided printing)">
            {busy || `⬇ Print sheet PDF (${ready.length})`}
          </Button>
        </div>
      </Card>
      {err && <Alert>{err}</Alert>}

      {!interns && <div className="text-sm text-slate-500">Loading…</div>}
      {interns && !list.length && <div className="text-sm text-slate-500">No approved interns {q || batchId ? "match these filters" : "yet"}.</div>}

      {ready.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {ready.map((i) => (
            <CardThumb key={i.id} intern={i} token={token} onOpen={() => setViewing(i)} />
          ))}
        </div>
      )}

      {noPhoto.length > 0 && (
        <Card
          title={`No ID card yet — photo not uploaded (${noPhoto.length})`}
          actions={
            <Button
              variant="light"
              className="text-xs px-3 py-1.5"
              onClick={() =>
                onMessage(
                  noPhoto.map((i) => i.id),
                  "Please upload a passport-style photo under Profile & ID Card in the intern portal so we can issue your IVIS LABS ID card."
                )
              }
            >
              ✉ Remind {noPhoto.length === 1 ? "them" : `all ${noPhoto.length}`}
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {noPhoto.map((i) => (
              <button key={i.id} onClick={() => onOpenIntern(i.id)} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full pl-1 pr-3 py-1 text-sm text-slate-800">
                <Avatar id={i.id} name={i.full_name} size={24} />
                {i.full_name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {viewing && <CardViewer intern={viewing} token={token} onClose={() => setViewing(null)} onOpenIntern={onOpenIntern} />}
    </div>
  );
}

/** Thumbnail that renders its card only once scrolled into view. */
function CardThumb({ intern, token, onOpen }) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    const el = ref.current;
    const start = () =>
      cardFor(intern, token)
        .then((c) => live && setSrc(c.thumb))
        .catch(() => live && setFailed(true));
    if (!("IntersectionObserver" in window)) {
      start();
      return () => {
        live = false;
      };
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => {
      live = false;
      io.disconnect();
    };
  }, [intern, token]);
  return (
    <button ref={ref} onClick={onOpen} className="group text-left">
      <div className="aspect-[54/85.6] rounded-xl overflow-hidden bg-slate-200 shadow-sm group-hover:shadow-lg group-hover:-translate-y-0.5 transition">
        {src ? (
          <img src={src} alt={`ID card of ${intern.full_name}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">{failed ? "Couldn't render" : "Rendering…"}</div>
        )}
      </div>
      <div className="mt-1.5 text-sm font-medium text-slate-800 truncate">{intern.full_name}</div>
      <div className="text-xs text-slate-500 truncate">{intern.intern_code}</div>
    </button>
  );
}

function CardViewer({ intern, token, onClose, onOpenIntern }) {
  const [cards, setCards] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    cardFor(intern, token).then(setCards, (e) => setErr(e.message || "Could not render the card"));
  }, [intern, token]);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const base = `IVIS_ID_${intern.intern_code}`;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="font-semibold text-slate-900">{intern.full_name}</div>
            <div className="text-sm text-slate-500">
              {intern.intern_code} · {intern.batch_name} · valid {fmtDate(intern.start_date)} – {fmtDate(intern.end_date)}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none" aria-label="Close">
            ✕
          </button>
        </div>
        {err && <Alert>{err}</Alert>}
        {!cards && !err && <div className="text-sm text-slate-500 py-10 text-center">Rendering…</div>}
        {cards && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Front", cards.front],
                ["Back", cards.back],
              ].map(([label, c]) => (
                <div key={label}>
                  <img src={label === "Front" ? cards.thumb : c.toDataURL("image/jpeg", 0.85)} alt={`${label} of ID card`} className="w-full rounded-xl shadow border border-slate-100" />
                  <button className="text-xs text-blue-600 hover:underline mt-1" onClick={() => downloadCanvasPng(c, `${base}_${label.toLowerCase()}.png`)}>
                    ⬇ {label} PNG
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={() => downloadIdCardPdf(cards, `${base}.pdf`)}>⬇ Download PDF</Button>
              <Button
                variant="light"
                onClick={() => {
                  onClose();
                  onOpenIntern(intern.id);
                }}
              >
                Open profile
              </Button>
              <a href={internVerifyUrl(intern.verify_token)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline self-center">
                Verification page ↗
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
