import React, { useCallback, useEffect, useState } from "react";
import { addDays, fmtDate, fmtDay, isSunday } from "../../utils/internDates";
import { Alert, Avatar, Button, Card, inputCls } from "../interns/ui";

/** Admin › Daily reports: everyone's report for one day, who hasn't filed, CSV export. */
export default function AdminReports({ call, token, batches, today, onOpenIntern, onMessage }) {
  const [date, setDate] = useState(today);
  const [batchId, setBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = new URLSearchParams({ date, ...(batchId ? { batch_id: batchId } : {}) });
      setData(await call(`/api/admin/reports?${qs}`));
    } catch (e) {
      setError(e.message);
    }
  }, [call, date, batchId]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const match = (r) => !q || [r.full_name, r.intern_code, r.batch_name].some((v) => v && String(v).toLowerCase().includes(q));
  const reports = (data?.reports || []).filter(match);
  const missing = (data?.missing || []).filter(match);
  const total = (data?.reports.length || 0) + (data?.missing.length || 0);
  const sunday = isSunday(date);

  const comment = async (reportId, text) => {
    const r = await call(`/api/admin/reports/${reportId}/comment`, { method: "PUT", body: { comment: text } });
    setData((d) => ({ ...d, reports: d.reports.map((x) => (x.id === reportId ? { ...x, ...r.report } : x)) }));
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Day</div>
            <div className="flex items-center gap-1">
              <Button variant="light" className="px-3" onClick={() => setDate((d) => addDays(d, -1))} title="Previous day">
                ‹
              </Button>
              <input type="date" className={`${inputCls} w-40`} value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
              <Button variant="light" className="px-3" onClick={() => setDate((d) => addDays(d, 1))} disabled={date >= today} title="Next day">
                ›
              </Button>
              {date !== today && (
                <Button variant="ghost" className="px-2" onClick={() => setDate(today)}>
                  Today
                </Button>
              )}
            </div>
          </div>
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
            <input className={inputCls} placeholder="Name or intern ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ExportCsv call={call} batchId={batchId} today={today} />
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}
      {!data && !error && <div className="text-sm text-slate-500">Loading…</div>}

      {data && (
        <>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{fmtDay(date)}</h2>
            <span className="text-sm text-slate-600">
              <b className="text-green-700">{data.reports.length}</b> of {total} active interns reported
              {sunday && <span className="text-slate-400"> · Sunday (reports optional)</span>}
            </span>
          </div>

          {missing.length > 0 && (
            <Card
              title={`Not reported (${missing.length})`}
              actions={
                !sunday && (
                  <Button
                    variant="light"
                    className="text-xs px-3 py-1.5"
                    onClick={() =>
                      onMessage(
                        missing.map((m) => m.id),
                        `Reminder: your daily report for ${fmtDate(date)} is pending. Please submit it from Calendar & Reports in the intern portal.`
                      )
                    }
                  >
                    ✉ Remind {missing.length === 1 ? "them" : `all ${missing.length}`}
                  </Button>
                )
              }
            >
              <div className="flex flex-wrap gap-2">
                {missing.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onOpenIntern(m.id)}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-full pl-1 pr-3 py-1 text-sm text-slate-800"
                    title={`${m.intern_code} · ${m.batch_name || ""}`}
                  >
                    <Avatar id={m.id} name={m.full_name} hasPhoto={m.has_photo} photoPath={`/api/admin/interns/${m.id}/photo`} token={token} version={m.photo_updated_at} size={24} />
                    {m.full_name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {!reports.length && <div className="text-sm text-slate-500">No reports {q ? "match your search" : "for this day"}.</div>}
          <div className="grid lg:grid-cols-2 gap-4">
            {reports.map((r) => (
              <ReportCard key={r.id} r={r} token={token} onOpenIntern={onOpenIntern} onComment={comment} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({ r, token, onOpenIntern, onComment }) {
  const [text, setText] = useState(r.admin_comment || "");
  const [state, setState] = useState("");
  const dirty = text.trim() !== (r.admin_comment || "");
  const save = async () => {
    setState("saving");
    try {
      await onComment(r.id, text);
      setState("saved");
    } catch (e) {
      setState(e.message);
    }
  };
  const fields = [
    ["Activities", r.activities],
    ["Learnings", r.learnings],
    ["Blockers", r.blockers],
    ["Plan for next day", r.plan_next],
    ["Links", r.links],
  ].filter(([, v]) => v);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <Avatar id={r.intern_id} name={r.full_name} hasPhoto={r.has_photo} photoPath={`/api/admin/interns/${r.intern_id}/photo`} token={token} version={r.photo_updated_at} size={36} />
        <button className="flex-1 min-w-0 text-left" onClick={() => onOpenIntern(r.intern_id)}>
          <div className="font-medium text-slate-900 truncate hover:text-blue-600">{r.full_name}</div>
          <div className="text-xs text-slate-500 truncate">
            {r.intern_code} · {r.batch_name || "no batch"}
          </div>
        </button>
        <div className="text-right shrink-0 text-xs">
          {r.hours != null && <div className="font-semibold text-slate-700">{r.hours} h</div>}
          {r.late && <span className="text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">late</span>}
        </div>
      </div>
      <dl className="space-y-2 text-sm flex-1">
        {fields.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-slate-400">{k}</dt>
            <dd className="text-slate-800 whitespace-pre-wrap break-words">
              {k === "Links"
                ? v.split(/\s+/).map((l, i) =>
                    /^https?:\/\//.test(l) ? (
                      <a key={i} className="text-blue-600 hover:underline mr-2" href={l} target="_blank" rel="noopener noreferrer">
                        {l}
                      </a>
                    ) : (
                      <span key={i}>{l} </span>
                    )
                  )
                : v}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 items-start">
        <textarea rows={1} className={`${inputCls} resize-y text-sm`} placeholder="Comment for the intern…" value={text} onChange={(e) => {
            setText(e.target.value);
            setState("");
          }} />
        <Button variant="dark" className="px-3 shrink-0" onClick={save} disabled={!dirty || state === "saving"}>
          {state === "saving" ? "…" : "Save"}
        </Button>
      </div>
      {state && state !== "saving" && <div className={`text-xs mt-1 ${state === "saved" ? "text-green-700" : "text-red-600"}`}>{state === "saved" ? "Comment saved — the intern can see it." : state}</div>}
    </div>
  );
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function ExportCsv({ call, batchId, today }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => addDays(today, -29));
  const [to, setTo] = useState(today);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true);
    setErr("");
    try {
      const qs = new URLSearchParams({ from, to, ...(batchId ? { batch_id: batchId } : {}) });
      const { reports } = await call(`/api/admin/reports?${qs}`);
      const cols = [
        ["Date", "date"],
        ["Intern ID", "intern_code"],
        ["Name", "full_name"],
        ["Batch", "batch_name"],
        ["Hours", "hours"],
        ["Activities", "activities"],
        ["Learnings", "learnings"],
        ["Blockers", "blockers"],
        ["Plan for next day", "plan_next"],
        ["Links", "links"],
        ["Submitted late", "late"],
        ["Admin comment", "admin_comment"],
      ];
      const lines = [cols.map((c) => c[0]).join(","), ...reports.map((r) => cols.map(([, k]) => csvCell(k === "late" ? (r.late ? "yes" : "") : r[k])).join(","))];
      const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `intern-reports_${from}_to_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!open)
    return (
      <Button variant="light" onClick={() => setOpen(true)}>
        ⬇ Export CSV
      </Button>
    );
  return (
    <div className="w-full flex flex-wrap items-end gap-2 bg-slate-50 rounded-xl p-3">
      <label className="text-xs text-slate-500">
        From
        <input type="date" className={`${inputCls} w-40 mt-1`} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label className="text-xs text-slate-500">
        To
        <input type="date" className={`${inputCls} w-40 mt-1`} value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
      </label>
      <Button onClick={run} disabled={busy || !from || !to}>
        {busy ? "Preparing…" : "Download"}
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {err && <div className="w-full text-xs text-red-600">{err}</div>}
    </div>
  );
}
