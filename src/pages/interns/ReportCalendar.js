import React, { useEffect, useMemo, useState } from "react";
import {
  addDays,
  expectedReportDays,
  fmtDate,
  fmtDay,
  isSunday,
  monthGrid,
  MONTH_NAMES,
} from "../../utils/internDates";
import { Alert, Button, Field, inputCls } from "./ui";

/**
 * Internship calendar with daily reports.
 *   mode="intern": click a day to submit/edit (today + `graceDays` previous days).
 *   mode="admin":  read-only reports, admin can leave a comment (onComment).
 */
export default function ReportCalendar({ startDate, endDate, today, graceDays = 2, reports, mode, onSave, onComment }) {
  const byDate = useMemo(() => Object.fromEntries((reports || []).map((r) => [r.date, r])), [reports]);
  const isAdmin = mode === "admin";

  const initialMonth = () => {
    const ref = !startDate ? today : today < startDate ? startDate : endDate && today > endDate ? endDate : today;
    return { y: Number(ref.slice(0, 4)), m: Number(ref.slice(5, 7)) - 1 };
  };
  const [ym, setYm] = useState(initialMonth);
  const [selected, setSelected] = useState(() => {
    if (isAdmin) return null;
    return today >= startDate && (!endDate || today <= endDate) ? today : null;
  });

  useEffect(() => {
    setYm(initialMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (!startDate) {
    return <Alert kind="warn">Start date has not been set yet.</Alert>;
  }

  // Working days so far, plus any optional day (Sunday) that has a report.
  const expected = [...new Set([...expectedReportDays(startDate, endDate, today), ...Object.keys(byDate).filter((d) => d >= startDate && d <= today)])];
  const submitted = expected.filter((d) => byDate[d]).length;
  const missing = expected.filter((d) => !byDate[d] && d < today).length;
  const late = (reports || []).filter((r) => r.late).length;
  const totalDays = endDate ? Math.round((new Date(endDate) - new Date(startDate)) / 864e5) + 1 : 0;
  const elapsed = today < startDate ? 0 : Math.min(totalDays, Math.round((new Date(today) - new Date(startDate)) / 864e5) + 1);
  const pct = totalDays ? Math.round((elapsed / totalDays) * 100) : 0;

  const minYM = Number(startDate.slice(0, 4)) * 12 + Number(startDate.slice(5, 7)) - 1;
  const maxRef = endDate || today;
  const maxYM = Number(maxRef.slice(0, 4)) * 12 + Number(maxRef.slice(5, 7)) - 1;
  const curYM = ym.y * 12 + ym.m;
  const shift = (n) => {
    const v = curYM + n;
    setYm({ y: Math.floor(v / 12), m: v % 12 });
  };

  const inRange = (d) => d >= startDate && (!endDate || d <= endDate);
  const editableFrom = addDays(today, -graceDays);

  const cellState = (d) => {
    if (!inRange(d)) return "out";
    const r = byDate[d];
    if (r) return r.late ? "late" : "done";
    if (d > today) return "future";
    if (d === today) return "due";
    if (isSunday(d)) return "off";
    return "missing";
  };

  const STYLE = {
    out: "text-slate-300 bg-white",
    future: "bg-white text-slate-500 border border-slate-100",
    done: "bg-green-500 text-white",
    late: "bg-amber-400 text-slate-900",
    due: "bg-white text-blue-700 ring-2 ring-blue-500",
    off: "bg-slate-100 text-slate-400",
    missing: "bg-red-100 text-red-700",
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Submitted" value={`${submitted}/${expected.length}`} tone="text-green-700" />
          <Stat label="Missing" value={missing} tone={missing ? "text-red-600" : "text-slate-900"} />
          <Stat label="Late" value={late} tone={late ? "text-amber-600" : "text-slate-900"} />
          <Stat label="Progress" value={`${pct}%`} sub={`Day ${elapsed} of ${totalDays}`} />
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <button className="px-3 py-1 rounded-lg hover:bg-slate-100 disabled:opacity-30" disabled={curYM <= minYM} onClick={() => shift(-1)} aria-label="Previous month">
              ‹
            </button>
            <div className="font-semibold text-slate-900">
              {MONTH_NAMES[ym.m]} {ym.y}
            </div>
            <button className="px-3 py-1 rounded-lg hover:bg-slate-100 disabled:opacity-30" disabled={curYM >= maxYM} onClick={() => shift(1)} aria-label="Next month">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] font-semibold text-slate-400 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {monthGrid(ym.y, ym.m).map((d, i) => {
              if (!d) return <div key={i} />;
              const st = cellState(d);
              const clickable = st !== "out" && (d <= today || byDate[d]);
              return (
                <button
                  key={d}
                  disabled={!clickable}
                  onClick={() => setSelected(d)}
                  className={`aspect-square rounded-lg text-sm font-medium flex flex-col items-center justify-center transition ${STYLE[st]} ${
                    selected === d ? "outline outline-2 outline-offset-2 outline-slate-900" : ""
                  } ${clickable ? "hover:brightness-95 cursor-pointer" : "cursor-default"}`}
                  title={fmtDay(d)}
                >
                  {Number(d.slice(8))}
                  {d === startDate && <span className="text-[9px] leading-none">start</span>}
                  {d === endDate && <span className="text-[9px] leading-none">end</span>}
                  {byDate[d] && byDate[d].admin_comment && <span className="text-[9px] leading-none">💬</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-slate-500">
            <Legend cls="bg-green-500" label="Submitted" />
            <Legend cls="bg-amber-400" label="Submitted late" />
            <Legend cls="bg-red-100" label="Missing" />
            <Legend cls="bg-white ring-2 ring-blue-500" label="Due today" />
            <Legend cls="bg-slate-100" label="Sunday (optional)" />
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Internship: {fmtDate(startDate)} – {fmtDate(endDate)}
          {!isAdmin && ` · Reports can be submitted for today and up to ${graceDays} previous days.`}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selected ? (
          <DayPanel
            key={selected}
            date={selected}
            report={byDate[selected]}
            editable={!isAdmin && inRange(selected) && selected <= today && selected >= editableFrom}
            isAdmin={isAdmin}
            onSave={onSave}
            onComment={onComment}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Select a day on the calendar to {isAdmin ? "view the report" : "write or view your report"}.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone = "text-slate-900" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <div className="text-[11px] font-semibold text-slate-400 uppercase">{label}</div>
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

function Legend({ cls, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded ${cls}`} />
      {label}
    </span>
  );
}

const FIELDS = [
  { key: "activities", label: "Activities performed today", required: true, rows: 5, placeholder: "What did you work on? Tasks, meetings, features, research…" },
  { key: "learnings", label: "Key learnings", rows: 2 },
  { key: "blockers", label: "Challenges / blockers", rows: 2 },
  { key: "plan_next", label: "Plan for next day", rows: 2 },
  { key: "links", label: "Links (PRs, docs, files)", rows: 1, placeholder: "https://…" },
];

function DayPanel({ date, report, editable, isAdmin, onSave, onComment }) {
  const [f, setF] = useState(() => ({
    activities: report?.activities || "",
    learnings: report?.learnings || "",
    blockers: report?.blockers || "",
    plan_next: report?.plan_next || "",
    links: report?.links || "",
    hours: report?.hours ?? "",
  }));
  const [comment, setComment] = useState(report?.admin_comment || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({});
    try {
      await onSave(date, f);
      setMsg({ kind: "success", text: report ? "Report updated." : "Report submitted. Great work!" });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const saveComment = async () => {
    setBusy(true);
    setMsg({});
    try {
      await onComment(report.id, comment);
      setMsg({ kind: "success", text: "Comment saved." });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="flex items-start justify-between gap-2 mb-4">
      <div>
        <div className="font-semibold text-slate-900">{fmtDay(date)}</div>
        <div className="text-xs text-slate-500">
          {report
            ? `Submitted ${new Date(report.created_at).toLocaleString()}${report.updated_at !== report.created_at ? " · edited" : ""}`
            : editable
            ? "Not submitted yet"
            : "No report submitted"}
        </div>
      </div>
      {report && report.late && <span className="text-xs font-semibold bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">Late</span>}
    </div>
  );

  if (!editable) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        {header}
        {report ? (
          <div className="space-y-3 text-sm">
            {FIELDS.filter((x) => report[x.key]).map((x) => (
              <div key={x.key}>
                <div className="text-xs font-semibold text-slate-400 uppercase">{x.label}</div>
                <div className="whitespace-pre-wrap text-slate-800 break-words">{report[x.key]}</div>
              </div>
            ))}
            {report.hours != null && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase">Hours</div>
                <div>{report.hours}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500">{isSunday(date) ? "Sunday — reports are optional." : "This day can no longer be edited."}</div>
        )}
        {report && isAdmin && (
          <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">
            <Field label="Feedback for intern">
              <textarea rows={3} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
            <Button variant="dark" onClick={saveComment} disabled={busy}>
              Save comment
            </Button>
          </div>
        )}
        {report && !isAdmin && report.admin_comment && <AdminComment text={report.admin_comment} />}
        {msg.text && <div className="mt-3"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
      {header}
      {FIELDS.map((x) => (
        <Field key={x.key} label={x.label} required={x.required}>
          <textarea
            rows={x.rows}
            className={inputCls}
            value={f[x.key]}
            placeholder={x.placeholder}
            required={x.required}
            minLength={x.required ? 10 : undefined}
            onChange={(e) => setF((s) => ({ ...s, [x.key]: e.target.value }))}
          />
        </Field>
      ))}
      <Field label="Hours spent">
        <input type="number" min="0" max="24" step="0.5" className={inputCls} value={f.hours} onChange={(e) => setF((s) => ({ ...s, hours: e.target.value }))} />
      </Field>
      {report && report.admin_comment && <AdminComment text={report.admin_comment} />}
      <Alert kind={msg.kind}>{msg.text}</Alert>
      <Button className="w-full py-2.5" disabled={busy}>
        {busy ? "Saving…" : report ? "Update report" : "Submit report"}
      </Button>
    </form>
  );
}

function AdminComment({ text }) {
  return (
    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
      <div className="text-xs font-semibold text-blue-700 mb-1">💬 FEEDBACK FROM IVIS LABS</div>
      <div className="whitespace-pre-wrap">{text}</div>
    </div>
  );
}
