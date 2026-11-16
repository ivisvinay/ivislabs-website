import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, authImageUrl, internVerifyUrl } from "../../services/internApi";
import { DURATIONS, durationMonths, specLabel } from "../../config/internOptions";
import { endDateFor, expectedReportDays, fmtDate, todayIST } from "../../utils/internDates";
import { renderIdCard, downloadIdCardPdf } from "../../utils/internIdCard";
import ReportCalendar from "../interns/ReportCalendar";
import AdminReports from "./AdminReports";
import AdminIdCards from "./AdminIdCards";
import AdminMessages from "./AdminMessages";
import { Alert, Avatar, Button, Card, Field, Select, StatusBadge, inputCls } from "../interns/ui";

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "all", label: "All" },
];

/**
 * Admin › Interns: approve registrations, manage batches and schedules, review
 * everyone's daily reports, view ID cards, and message interns.
 */
/**
 * Controlled by the admin console: `view` is "list" | "reports" | "cards" |
 * "messages"; `navTick` changes whenever the admin taps a nav item (resets
 * drill-downs); `onBadges({ pending, unread })` feeds the nav badges.
 */
export default function InternsAdmin({ token, onAuthError, view, onView, navTick, onBadges }) {
  const setView = onView;
  const [interns, setInterns] = useState(null);
  const [today, setToday] = useState(todayIST());
  const [inbox, setInbox] = useState(null);
  const [draft, setDraft] = useState(null); // { ids, text, nonce } prefilled compose
  const [chatWith, setChatWith] = useState(null);
  const [batches, setBatches] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  const call = useCallback(
    async (path, opts = {}) => {
      try {
        return await api(path, { ...opts, token });
      } catch (e) {
        if (e.status === 401) onAuthError();
        throw e;
      }
    },
    [token, onAuthError]
  );

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([call("/api/admin/interns"), call("/api/admin/batches")]);
      setInterns(a.interns);
      setToday(a.today);
      setBatches(b.batches);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshInbox = useCallback(() => {
    call("/api/admin/chat/inbox")
      .then(setInbox)
      .catch(() => {});
  }, [call]);
  useEffect(() => {
    refreshInbox();
    const t = setInterval(refreshInbox, 30000);
    return () => clearInterval(t);
  }, [refreshInbox]);

  const openIntern = (id) => {
    setSelectedId(id);
    setView("list");
    window.scrollTo(0, 0);
  };
  const messageInterns = (ids, text = "") => {
    setDraft({ ids, text, nonce: Date.now() });
    setChatWith(null);
    setSelectedId(null);
    setView("messages");
  };
  const chatWithIntern = (id) => {
    setChatWith(id);
    setSelectedId(null);
    setView("messages");
  };

  const counts = useMemo(() => {
    const c = { all: (interns || []).length };
    for (const i of interns || []) c[i.status] = (c[i.status] || 0) + 1;
    return c;
  }, [interns]);

  // Tapping a nav item returns to that tab's top level.
  useEffect(() => {
    if (!navTick) return;
    setSelectedId(null);
    setDraft(null);
    setChatWith(null);
  }, [navTick]);

  const unread = inbox ? inbox.unread : 0;
  useEffect(() => {
    if (onBadges) onBadges({ pending: counts.pending || 0, unread });
  }, [onBadges, counts.pending, unread]);

  const q = search.trim().toLowerCase();
  const shown = (interns || []).filter(
    (i) =>
      (filter === "all" || i.status === filter) &&
      (!q || [i.full_name, i.email, i.college, i.phone, i.intern_code, i.batch_name].some((v) => v && String(v).toLowerCase().includes(q)))
  );
  const selected = (interns || []).find((i) => i.id === selectedId);

  const onUpdated = (row) => {
    setInterns((list) => list.map((i) => (i.id === row.id ? { ...i, ...row } : i)));
    call("/api/admin/batches").then((b) => setBatches(b.batches)).catch(() => {});
  };

  let body;
  if (view === "reports") {
    body = <AdminReports call={call} token={token} batches={batches} today={today} onOpenIntern={openIntern} onMessage={messageInterns} />;
  } else if (view === "cards") {
    body = <AdminIdCards interns={interns} batches={batches} token={token} onOpenIntern={openIntern} onMessage={messageInterns} />;
  } else if (view === "messages") {
    body = (
      <AdminMessages
        call={call}
        token={token}
        interns={interns}
        batches={batches}
        inbox={inbox}
        refreshInbox={refreshInbox}
        draft={draft}
        openInternId={chatWith}
        onOpenIntern={openIntern}
      />
    );
  } else {
    body = renderList();
  }
  return body;

  function renderList() {
    if (selected) {
      return (
        <InternDetail
          key={selected.id}
          intern={selected}
          today={today}
          batches={batches}
          call={call}
          token={token}
          onBack={() => {
            setSelectedId(null);
            load();
          }}
          onUpdated={onUpdated}
          onBatchCreated={(b) => setBatches((l) => [b, ...l])}
          onMessage={() => chatWithIntern(selected.id)}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
          <div className="md:col-span-2 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {f.label}
                  {counts[f.key] ? <span className="ml-1.5 opacity-75">{counts[f.key]}</span> : null}
                </button>
              ))}
              </div>
              <input className={`${inputCls} sm:w-56 sm:ml-auto`} placeholder="Search name, email, college…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
              {!interns && <div className="p-5 text-sm text-slate-500">Loading…</div>}
              {interns && !shown.length && <div className="p-5 text-sm text-slate-500">No interns here.</div>}
              {shown.map((i) => {
                const expected = i.status === "approved" ? expectedReportDays(i.start_date, i.end_date, today).length : 0;
                return (
                  <button key={i.id} onClick={() => setSelectedId(i.id)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3">
                    <Avatar id={i.id} name={i.full_name} hasPhoto={i.has_photo} photoPath={`/api/admin/interns/${i.id}/photo`} token={token} version={i.photo_updated_at} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">{i.full_name}</span>
                        <StatusBadge status={i.status} />
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {i.degree} · {specLabel(i)} · {i.college}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {i.status === "pending"
                          ? `${i.duration_label} · wants to start ${fmtDate(i.preferred_start)} · registered ${fmtDate(i.created_at.slice(0, 10))}`
                          : `${i.intern_code || ""} · ${i.batch_name || "no batch"} · ${fmtDate(i.start_date)} – ${fmtDate(i.end_date)}`}
                      </div>
                    </div>
                    {i.status === "approved" && (
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-semibold ${i.report_count < expected ? "text-red-600" : "text-green-700"}`}>
                          {i.report_count}/{expected}
                        </div>
                        <div className="text-[10px] text-slate-400">reports</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <BatchesCard batches={batches} call={call} onCreated={(b) => setBatches((l) => [b, ...l])} />
        </div>
      </div>
    );
  }
}

function BatchesCard({ batches, call, onCreated }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const create = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const r = await call("/api/admin/batches", { method: "POST", body: { name } });
      onCreated({ ...r.batch, intern_count: 0 });
      setName("");
    } catch (e2) {
      setErr(e2.message);
    }
  };
  return (
    <Card title="Batches">
      <form onSubmit={create} className="flex gap-2 mb-3">
        <input className={inputCls} placeholder="e.g. Dec 2026 – AI" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button className="shrink-0">Add</Button>
      </form>
      <Alert>{err}</Alert>
      <ul className="text-sm divide-y divide-slate-100">
        {batches.map((b) => (
          <li key={b.id} className="py-2 flex justify-between">
            <span className="text-slate-800">{b.name}</span>
            <span className="text-slate-400 text-xs">{b.intern_count} interns</span>
          </li>
        ))}
        {!batches.length && <li className="py-2 text-xs text-slate-400">No batches yet. Create one before approving interns.</li>}
      </ul>
      <p className="text-xs text-slate-400 mt-3">Each batch gets its own group chat. Interns can only chat with members of their batch.</p>
    </Card>
  );
}

function InternDetail({ intern, today, batches, call, token, onBack, onUpdated, onBatchCreated, onMessage }) {
  const [reports, setReports] = useState(null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  const isNew = !intern.intern_code;
  const [sched, setSched] = useState(() => {
    const start = intern.start_date || intern.preferred_start || today;
    return {
      batch_id: intern.batch_id ? String(intern.batch_id) : batches[0] ? String(batches[0].id) : "",
      start_date: start,
      end_date: intern.end_date || endDateFor(start, durationMonths(intern.duration)),
      duration: intern.duration,
    };
  });
  const [note, setNote] = useState(intern.admin_note || "");

  useEffect(() => {
    if (intern.status !== "pending")
      call(`/api/admin/interns/${intern.id}/reports`)
        .then((r) => setReports(r.reports))
        .catch(() => setReports([]));
  }, [intern.id, intern.status, call]);

  const run = async (fn, ok) => {
    setBusy(true);
    setMsg({});
    try {
      const r = await fn();
      if (r && r.intern) onUpdated(r.intern);
      setMsg({ kind: "success", text: typeof ok === "function" ? ok(r) : ok });
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const setStart = (v) =>
    setSched((s) => ({ ...s, start_date: v, end_date: v ? endDateFor(v, durationMonths(s.duration)) : s.end_date }));
  const setDuration = (v) =>
    setSched((s) => ({ ...s, duration: v, end_date: s.start_date ? endDateFor(s.start_date, durationMonths(v)) : s.end_date }));

  const approve = () =>
    run(
      () =>
        call(`/api/admin/interns/${intern.id}/approve`, {
          method: "POST",
          body: { batch_id: Number(sched.batch_id), start_date: sched.start_date, end_date: sched.end_date, admin_note: note },
        }),
      "Approved. The intern can now sign in to the portal."
    );
  const saveSchedule = () =>
    run(
      () =>
        call(`/api/admin/interns/${intern.id}`, {
          method: "PATCH",
          body: { batch_id: Number(sched.batch_id), start_date: sched.start_date, end_date: sched.end_date, duration: sched.duration },
        }),
      "Schedule updated."
    );
  const setStatus = (status, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    run(() => call(`/api/admin/interns/${intern.id}`, { method: "PATCH", body: { status, admin_note: note } }), `Status set to ${status}.`);
  };
  const resetPassword = () => {
    if (!window.confirm(`Reset ${intern.full_name}'s password? They will be signed out everywhere.`)) return;
    run(
      () => call(`/api/admin/interns/${intern.id}/reset-password`, { method: "POST" }),
      (r) => `Temporary password: ${r.password} — share it with the intern privately and ask them to change it.`
    );
  };
  const quickBatch = async () => {
    const name = window.prompt("New batch name");
    if (!name) return;
    try {
      const r = await call("/api/admin/batches", { method: "POST", body: { name } });
      onBatchCreated({ ...r.batch, intern_count: 0 });
      setSched((s) => ({ ...s, batch_id: String(r.batch.id) }));
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    }
  };
  const downloadCard = () =>
    run(async () => {
      const photoUrl = await authImageUrl(`/api/admin/interns/${intern.id}/photo`, token, intern.photo_updated_at);
      const cards = await renderIdCard({ intern, batchName: intern.batch_name, photoUrl, verifyUrl: internVerifyUrl(intern.verify_token) });
      downloadIdCardPdf(cards, `IVIS_ID_${intern.intern_code}.pdf`);
    }, "ID card downloaded.");

  const comment = async (reportId, text) => {
    const r = await call(`/api/admin/reports/${reportId}/comment`, { method: "PUT", body: { comment: text } });
    setReports((l) => l.map((x) => (x.id === reportId ? r.report : x)));
  };

  const details = [
    ["Email", intern.email],
    ["Phone", intern.phone],
    ["WhatsApp", intern.whatsapp],
    ["Date of birth", fmtDate(intern.dob)],
    ["Gender", intern.gender],
    ["College", intern.college],
    ["University", intern.university],
    ["Degree", intern.degree],
    ["Specialization", specLabel(intern)],
    ["Year of study", intern.year_of_study],
    ["Graduation year", intern.graduation_year],
    ["Duration", intern.duration_label],
    ["Preferred start", fmtDate(intern.preferred_start)],
    ["Area of interest", intern.domain],
    ["Skills", intern.skills],
    ["City / State", [intern.city, intern.state].filter(Boolean).join(", ")],
    ["Address", intern.address],
    ["Emergency contact", `${intern.emergency_name || ""} · ${intern.emergency_phone || ""}`],
    ["LinkedIn", intern.linkedin],
    ["GitHub / portfolio", intern.github],
    ["Heard via", intern.referral],
    ["Registered", new Date(intern.created_at).toLocaleString()],
    ["Approved", intern.approved_at ? `${new Date(intern.approved_at).toLocaleString()} by ${intern.approved_by}` : ""],
  ].filter(([, v]) => v && v !== " · ");

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
        ← All interns
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
        <Card className="md:col-span-2 min-w-0">
          <div className="flex items-start gap-4 mb-5">
            <Avatar id={intern.id} name={intern.full_name} hasPhoto={intern.has_photo} photoPath={`/api/admin/interns/${intern.id}/photo`} token={token} version={intern.photo_updated_at} size={72} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{intern.full_name}</h2>
                <StatusBadge status={intern.status} />
              </div>
              <div className="text-sm text-slate-500">
                {intern.intern_code || "No intern ID yet"}
                {intern.batch_name && ` · ${intern.batch_name}`}
              </div>
              {intern.start_date && (
                <div className="text-sm text-slate-500">
                  {fmtDate(intern.start_date)} – {fmtDate(intern.end_date)}
                </div>
              )}
            </div>
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-400">{k}</dt>
                <dd className="text-slate-800 break-words">{/^https?:\/\//.test(v) ? <a className="text-blue-600 hover:underline" href={v} target="_blank" rel="noopener noreferrer">{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card title={isNew ? "Approve & schedule" : "Schedule"}>
            <div className="space-y-3">
              <Field label="Batch" required>
                <div className="flex gap-2">
                  <Select value={sched.batch_id} onChange={(v) => setSched((s) => ({ ...s, batch_id: v }))} options={batches.map((b) => ({ value: String(b.id), label: b.name }))} placeholder="Choose batch" />
                  <Button type="button" variant="light" className="px-3 shrink-0" onClick={quickBatch} title="New batch">
                    +
                  </Button>
                </div>
              </Field>
              <Field label="Duration">
                <Select value={sched.duration} onChange={setDuration} options={DURATIONS} />
              </Field>
              <Field label="Start date" required>
                <input type="date" className={inputCls} value={sched.start_date || ""} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="End date" hint="Auto-filled from duration; adjust if needed">
                <input type="date" className={inputCls} value={sched.end_date || ""} min={sched.start_date} onChange={(e) => setSched((s) => ({ ...s, end_date: e.target.value }))} />
              </Field>
              <Field label="Note to intern (optional)">
                <textarea rows={2} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              {isNew ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={approve} disabled={busy || !sched.batch_id || !sched.start_date}>
                    ✔ Approve
                  </Button>
                  {intern.status !== "rejected" && (
                    <Button variant="light" onClick={() => setStatus("rejected", `Reject ${intern.full_name}'s application?`)} disabled={busy}>
                      Reject
                    </Button>
                  )}
                </div>
              ) : (
                <Button variant="dark" onClick={saveSchedule} disabled={busy}>
                  Save schedule
                </Button>
              )}
            </div>
          </Card>

          {!isNew && (
            <Card title="Account">
              <div className="flex flex-wrap gap-2">
                {intern.status === "approved" ? (
                  <Button variant="light" onClick={() => setStatus("suspended", `Suspend ${intern.full_name}? They lose portal access and their ID card shows as revoked.`)} disabled={busy}>
                    Suspend
                  </Button>
                ) : (
                  <Button onClick={() => setStatus("approved")} disabled={busy}>
                    Re-activate
                  </Button>
                )}
                {intern.status === "approved" && (
                  <Button variant="light" onClick={onMessage} disabled={busy}>
                    ✉ Message
                  </Button>
                )}
                <Button variant="light" onClick={resetPassword} disabled={busy}>
                  Reset password
                </Button>
                {intern.has_photo && intern.verify_token && (
                  <Button variant="light" onClick={downloadCard} disabled={busy}>
                    ⬇ ID card
                  </Button>
                )}
                {intern.verify_token && (
                  <a href={internVerifyUrl(intern.verify_token)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline self-center">
                    Verification page ↗
                  </a>
                )}
              </div>
            </Card>
          )}
          {msg.text && <Alert kind={msg.kind}>{msg.text}</Alert>}
        </div>
      </div>

      {intern.start_date && reports && (
        <Card title="Daily reports">
          <ReportCalendar startDate={intern.start_date} endDate={intern.end_date} today={today} reports={reports} mode="admin" onComment={comment} />
        </Card>
      )}
    </div>
  );
}
