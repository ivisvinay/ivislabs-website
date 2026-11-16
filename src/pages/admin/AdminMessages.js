import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fmtChatDay, fmtTime } from "../../utils/internDates";
import { Alert, Avatar, Button, inputCls } from "../interns/ui";

/**
 * Admin › Messages. Every intern has one private chat with the IVIS LABS team;
 * admins can reply there, or send one message to selected interns, a batch or
 * everyone — each copy lands in the recipient's own private chat.
 */
export default function AdminMessages({ call, token, interns, batches, inbox, refreshInbox, draft, openInternId, onOpenIntern }) {
  const [view, setView] = useState(() => (openInternId ? { internId: openInternId } : { compose: true }));
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (draft) setView({ compose: true });
  }, [draft]);
  useEffect(() => {
    if (openInternId) setView({ internId: openInternId });
  }, [openInternId]);

  // Faster inbox refresh while this view is open.
  useEffect(() => {
    const t = setInterval(refreshInbox, 8000);
    return () => clearInterval(t);
  }, [refreshInbox]);

  const active = useMemo(() => (interns || []).filter((i) => i.status === "approved"), [interns]);
  const byId = useMemo(() => Object.fromEntries((interns || []).map((i) => [i.id, i])), [interns]);
  const threads = inbox?.threads || [];
  const withThread = new Set(threads.map((t) => t.intern_id));
  const q = search.trim().toLowerCase();
  const m = (i) => !q || [i.full_name, i.intern_code, i.batch_name].some((v) => v && String(v).toLowerCase().includes(q));
  const shownThreads = threads.filter(m);
  const others = active.filter((i) => !withThread.has(i.id) && m(i));
  const openId = view.internId;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex h-[calc(100vh-220px)] min-h-[520px]">
      <aside className={`${view.compose || openId ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 flex-col border-r border-slate-100`}>
        <div className="p-3 border-b border-slate-100 space-y-2">
          <Button className="w-full" onClick={() => setView({ compose: true })}>
            ✎ New message / broadcast
          </Button>
          <input className={inputCls} placeholder="Search interns" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {shownThreads.map((t) => {
            const last = t.last_message;
            const preview = last ? `${last.sender_id === 0 ? "You: " : ""}${last.kind === "ping" ? "🔔 Ping" : last.body}` : "";
            return (
              <button key={t.id} onClick={() => setView({ internId: t.intern_id })} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 ${openId === t.intern_id ? "bg-blue-50" : ""}`}>
                <Avatar id={t.intern_id} name={t.full_name} hasPhoto={t.has_photo} photoPath={`/api/admin/interns/${t.intern_id}/photo`} token={token} version={t.photo_updated_at} size={40} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${t.unread ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>{t.full_name}</span>
                    {last && <span className="text-[10px] text-slate-400 shrink-0">{fmtChatDay(last.created_at) === "Today" ? fmtTime(last.created_at) : fmtChatDay(last.created_at)}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-xs ${t.unread ? "text-slate-800" : "text-slate-500"}`}>{preview}</span>
                    {t.unread > 0 && <span className="shrink-0 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{t.unread}</span>}
                  </span>
                </span>
              </button>
            );
          })}
          {others.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-semibold text-slate-400 uppercase">Other active interns</div>
              {others.map((i) => (
                <button key={i.id} onClick={() => setView({ internId: i.id })} className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 ${openId === i.id ? "bg-blue-50" : ""}`}>
                  <Avatar id={i.id} name={i.full_name} hasPhoto={i.has_photo} photoPath={`/api/admin/interns/${i.id}/photo`} token={token} version={i.photo_updated_at} size={32} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">{i.full_name}</span>
                    <span className="block text-xs text-slate-400 truncate">
                      {i.intern_code} · {i.batch_name}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}
          {!threads.length && !active.length && <div className="p-4 text-xs text-slate-400">No active interns yet.</div>}
        </div>
      </aside>

      <section className={`${view.compose || openId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {view.compose ? (
          <Compose
            key={draft ? draft.nonce : "compose"}
            call={call}
            token={token}
            active={active}
            batches={batches}
            draft={draft}
            onBack={() => setView({})}
            onSent={(n, onlyOne) => {
              refreshInbox();
              if (onlyOne) setView({ internId: onlyOne });
            }}
          />
        ) : openId ? (
          <AdminThread
            key={openId}
            call={call}
            token={token}
            intern={byId[openId] || threads.find((t) => t.intern_id === openId) || { id: openId, full_name: "Intern" }}
            onBack={() => setView({})}
            onActivity={refreshInbox}
            onOpenIntern={onOpenIntern}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400 p-6 text-center">Pick an intern, or write a new message.</div>
        )}
      </section>
    </div>
  );
}

/* ---------------- Compose: individual / selected / batch / everyone ---------------- */

function Compose({ call, token, active, batches, draft, onBack, onSent }) {
  const [mode, setMode] = useState(draft && draft.ids ? "selected" : "all");
  const [batchId, setBatchId] = useState(batches[0] ? String(batches[0].id) : "");
  const [picked, setPicked] = useState(() => new Set(draft?.ids || []));
  const [filter, setFilter] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [text, setText] = useState(draft?.text || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const q = filter.trim().toLowerCase();
  const shown = active.filter(
    (i) => (!filterBatch || String(i.batch_id) === filterBatch) && (!q || [i.full_name, i.intern_code, i.college].some((v) => v && String(v).toLowerCase().includes(q)))
  );
  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const batchCount = active.filter((i) => String(i.batch_id) === batchId).length;
  const count = mode === "all" ? active.length : mode === "batch" ? batchCount : picked.size;
  const batchName = batches.find((b) => String(b.id) === batchId)?.name;
  const label = mode === "all" ? `all ${count} active interns` : mode === "batch" ? `${count} intern${count === 1 ? "" : "s"} in ${batchName}` : `${count} selected intern${count === 1 ? "" : "s"}`;

  const send = async (kind) => {
    if (kind === "text" && !text.trim()) return;
    if (!count) return setMsg({ kind: "error", text: "No recipients selected." });
    if (count > 1 && !window.confirm(`${kind === "ping" ? "Ping" : "Send this message to"} ${label}?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const body = { to: mode, kind, body: kind === "text" ? text : "" };
      if (mode === "batch") body.batch_id = Number(batchId);
      if (mode === "selected") body.ids = [...picked];
      const r = await call("/api/admin/chat/send", { method: "POST", body });
      setMsg({ kind: "success", text: `${kind === "ping" ? "Pinged" : "Sent to"} ${r.sent} intern${r.sent === 1 ? "" : "s"}. Each one received it in their private chat with IVIS LABS.` });
      if (kind === "text") setText("");
      onSent(r.sent, mode === "selected" && picked.size === 1 && kind === "text" ? [...picked][0] : null);
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const tabCls = (k) => `px-3 py-1.5 rounded-lg text-sm font-medium border ${mode === k ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"}`;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <button className="md:hidden text-slate-500 px-1 text-lg" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div className="font-semibold text-slate-900">New message</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-xs text-slate-500 mb-1.5">Send to</div>
          <div className="flex flex-wrap gap-2">
            <button className={tabCls("all")} onClick={() => setMode("all")}>
              📢 Everyone ({active.length})
            </button>
            <button className={tabCls("batch")} onClick={() => setMode("batch")} disabled={!batches.length}>
              👥 A batch
            </button>
            <button className={tabCls("selected")} onClick={() => setMode("selected")}>
              ☑ Selected interns{picked.size ? ` (${picked.size})` : ""}
            </button>
          </div>
        </div>

        {mode === "batch" && (
          <select className={`${inputCls} max-w-xs`} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({active.filter((i) => i.batch_id === b.id).length})
              </option>
            ))}
          </select>
        )}

        {mode === "selected" && (
          <div className="border border-slate-200 rounded-xl">
            <div className="flex flex-wrap gap-2 p-2 border-b border-slate-100">
              <input className={`${inputCls} flex-1 min-w-[140px]`} placeholder="Filter by name, ID, college" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <select className={`${inputCls} w-40`} value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
                <option value="">All batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Button variant="light" className="px-3 text-xs" onClick={() => setPicked((s) => new Set([...s, ...shown.map((i) => i.id)]))}>
                Select shown
              </Button>
              <Button variant="ghost" className="px-3 text-xs" onClick={() => setPicked(new Set())} disabled={!picked.size}>
                Clear
              </Button>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
              {shown.map((i) => (
                <label key={i.id} className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} />
                  <Avatar id={i.id} name={i.full_name} hasPhoto={i.has_photo} photoPath={`/api/admin/interns/${i.id}/photo`} token={token} version={i.photo_updated_at} size={26} />
                  <span className="text-sm text-slate-800 truncate flex-1">{i.full_name}</span>
                  <span className="text-xs text-slate-400 truncate">{i.batch_name}</span>
                </label>
              ))}
              {!shown.length && <div className="p-3 text-xs text-slate-400">No active interns match.</div>}
            </div>
          </div>
        )}

        <textarea rows={6} className={inputCls} placeholder="Write your message…" value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => send("text")} disabled={busy || !text.trim() || !count}>
            {busy ? "Sending…" : `Send to ${count}`}
          </Button>
          <Button variant="light" onClick={() => send("ping")} disabled={busy || !count} title="Buzz them with a sound and pop-up alert">
            🔔 Ping {count > 1 ? "them" : ""}
          </Button>
          <span className="text-xs text-slate-500">Goes to {label}, each in their own private chat.</span>
        </div>
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      </div>
    </div>
  );
}

/* ---------------- One intern's private chat ---------------- */

function AdminThread({ call, token, intern, onBack, onActivity, onOpenIntern }) {
  const [list, setList] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroller = useRef(null);
  const stick = useRef(true);
  const prevHeight = useRef(0);
  const lastIdRef = useRef(0);
  const readRef = useRef(0);
  const base = `/api/admin/chat/${intern.id}`;

  const markRead = useCallback(
    (lastId) => {
      if (!lastId || lastId <= readRef.current) return;
      readRef.current = lastId;
      call(`${base}/read`, { method: "POST", body: { lastId } })
        .then(onActivity)
        .catch(() => {});
    },
    [call, base, onActivity]
  );

  const merge = useCallback(
    (incoming, prepend) => {
      setList((cur) => {
        const all = prepend ? [...incoming, ...(cur || [])] : [...(cur || []), ...incoming];
        const uniq = [...new Map(all.map((m) => [m.id, m])).values()].sort((a, b) => a.id - b.id);
        lastIdRef.current = uniq.length ? uniq[uniq.length - 1].id : 0;
        return uniq;
      });
    },
    []
  );

  useEffect(() => {
    let live = true;
    call(`${base}/messages`)
      .then((r) => {
        if (!live) return;
        merge(r.messages);
        setHasMore(r.hasMore);
        if (r.messages.length) markRead(r.messages[r.messages.length - 1].id);
      })
      .catch((e) => live && setErr(e.message));
    const t = setInterval(() => {
      if (document.hidden) return;
      call(`${base}/messages${lastIdRef.current ? `?after=${lastIdRef.current}` : ""}`)
        .then((r) => {
          if (!live || !r.messages.length) return;
          merge(r.messages);
          markRead(r.messages[r.messages.length - 1].id);
        })
        .catch(() => {});
    }, 4000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [call, base, merge, markRead]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !list) return;
    if (stick.current) el.scrollTop = el.scrollHeight;
    else if (prevHeight.current && el.scrollTop < 10) el.scrollTop = el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [list]);

  const older = async () => {
    if (!list || !list.length) return;
    stick.current = false;
    const r = await call(`${base}/messages?before=${list[0].id}`);
    merge(r.messages, true);
    setHasMore(r.hasMore);
  };

  const send = async (kind) => {
    const body = text.trim();
    if (kind === "text" && !body) return;
    setBusy(true);
    setErr("");
    try {
      stick.current = true;
      const r = await call("/api/admin/chat/send", { method: "POST", body: { to: "selected", ids: [intern.id], kind, body } });
      merge(r.messages);
      if (kind === "text") setText("");
      onActivity();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  let lastDay = "";
  return (
    <>
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-100">
        <button className="md:hidden text-slate-500 px-1 text-lg" onClick={onBack} aria-label="Back">
          ←
        </button>
        <Avatar id={intern.id} name={intern.full_name} hasPhoto={intern.has_photo} photoPath={`/api/admin/interns/${intern.id}/photo`} token={token} version={intern.photo_updated_at} size={36} />
        <button className="flex-1 min-w-0 text-left" onClick={() => onOpenIntern(intern.id)} title="Open profile">
          <div className="font-semibold text-sm text-slate-900 truncate hover:text-blue-600">{intern.full_name}</div>
          <div className="text-xs text-slate-500 truncate">
            {[intern.intern_code, intern.batch_name].filter(Boolean).join(" · ")}
            {intern.status && intern.status !== "approved" ? ` · ${intern.status} (can't read messages)` : ""}
          </div>
        </button>
        <Button variant="light" className="px-3" onClick={() => send("ping")} disabled={busy} title="Buzz them with a sound and pop-up alert">
          🔔 Ping
        </Button>
      </div>

      <div ref={scroller} onScroll={(e) => (stick.current = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 80)} className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1 bg-slate-50">
        {hasMore && (
          <div className="text-center mb-2">
            <button className="text-xs text-blue-600 hover:underline" onClick={() => older().catch((e) => setErr(e.message))}>
              Load earlier messages
            </button>
          </div>
        )}
        {!list && <div className="text-center text-xs text-slate-400">Loading…</div>}
        {list && !list.length && <div className="text-center text-xs text-slate-400 mt-10">No messages yet. Anything you send appears in {intern.full_name.split(" ")[0]}'s "IVIS LABS Team" chat.</div>}
        {(list || []).map((m, idx) => {
          const day = fmtChatDay(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.sender_id === 0;
          const prev = list[idx - 1];
          const showName = mine && (!prev || prev.sender_id !== 0 || prev.sender_admin !== m.sender_admin || showDay);
          return (
            <React.Fragment key={m.id}>
              {showDay && (
                <div className="text-center my-3">
                  <span className="text-[11px] bg-white border border-slate-200 text-slate-500 rounded-full px-2.5 py-0.5">{day}</span>
                </div>
              )}
              {m.kind === "ping" ? (
                <div className="text-center my-2">
                  <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-3 py-1">
                    🔔 {mine ? m.sender_name : intern.full_name} pinged {mine ? intern.full_name.split(" ")[0] : "IVIS LABS"} · {fmtTime(m.created_at)}
                  </span>
                </div>
              ) : (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${mine ? "bg-blue-600 text-white rounded-br-md" : "bg-white text-slate-800 rounded-bl-md"}`}>
                    {showName && <div className="text-[11px] font-semibold text-blue-100 mb-0.5">{m.sender_name}</div>}
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div className={`text-[10px] text-right ${mine ? "text-blue-100" : "text-slate-400"}`}>{fmtTime(m.created_at)}</div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {err && (
        <div className="px-3 pt-2">
          <Alert>{err}</Alert>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send("text");
        }}
        className="flex items-end gap-2 p-3 border-t border-slate-100"
      >
        <textarea
          rows={1}
          className={`${inputCls} resize-none max-h-32`}
          placeholder={`Message ${intern.full_name.split(" ")[0]}…`}
          value={text}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send("text");
            }
          }}
        />
        <Button disabled={busy || !text.trim()}>Send</Button>
      </form>
    </>
  );
}
