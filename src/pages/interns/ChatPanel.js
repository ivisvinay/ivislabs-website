import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { conversationTitle } from "./useChat";
import { Avatar, Alert, Button, inputCls } from "./ui";
import { fmtChatDay, fmtTime } from "../../utils/internDates";

/** Batch chat: batch channel (1-many), groups (1-many) and direct messages (1-1). */
export default function ChatPanel({ chat, me, token }) {
  const [params, setParams] = useSearchParams();
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [filter, setFilter] = useState("");
  const [notifPerm, setNotifPerm] = useState(() => ("Notification" in window ? Notification.permission : "unsupported"));
  const { conversations, contacts, online, activeId, setActiveId } = chat;

  // Open the conversation from ?c= (e.g. from a ping banner); clear active on leave.
  const wanted = Number(params.get("c")) || null;
  useEffect(() => {
    if (wanted && wanted !== activeId) setActiveId(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);
  useEffect(() => () => setActiveId(null), [setActiveId]);

  const open = (id) => {
    setParams(id ? { c: String(id) } : {});
    setActiveId(id);
  };

  const dmWith = useMemo(() => {
    const map = {};
    for (const c of conversations) {
      if (c.type !== "dm") continue;
      const other = (c.members || []).find((m) => m.id !== me.id);
      if (other) map[other.id] = c;
    }
    return map;
  }, [conversations, me.id]);

  const contactById = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);
  const active = conversations.find((c) => c.id === activeId);
  const q = filter.trim().toLowerCase();
  const visibleConvs = conversations.filter((c) => !q || conversationTitle(c, me.id).toLowerCase().includes(q));
  const newContacts = contacts.filter((c) => !dmWith[c.id] && (!q || c.full_name.toLowerCase().includes(q)));

  const startDm = async (contactId) => {
    const existing = dmWith[contactId];
    if (existing) return open(existing.id);
    try {
      open(await chat.startDm(contactId));
    } catch (e) {
      alertError(e);
    }
  };
  const [err, setErr] = useState("");
  const alertError = (e) => setErr(e.message || String(e));

  const askNotif = async () => {
    try {
      setNotifPerm(await Notification.requestPermission());
    } catch (_) {
      /* ignore */
    }
  };

  const convAvatar = (c, size = 40) => {
    if (c.type === "dm") {
      const other = (c.members || []).find((m) => m.id !== me.id) || {};
      const info = contactById[other.id] || {};
      return <Avatar id={other.id} name={other.full_name} hasPhoto={info.has_photo} photoPath={`/api/interns/photo/${other.id}`} token={token} size={size} online={online.has(other.id)} />;
    }
    if (c.type === "admin") {
      return (
        <span className="shrink-0 rounded-xl flex items-center justify-center text-white font-bold bg-blue-600" style={{ width: size, height: size, fontSize: size * 0.32 }}>
          IVIS
        </span>
      );
    }
    return (
      <span className={`shrink-0 rounded-xl flex items-center justify-center text-white font-bold ${c.type === "batch" ? "bg-slate-900" : "bg-indigo-500"}`} style={{ width: size, height: size }}>
        {c.type === "batch" ? "#" : "👥"}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex h-[calc(100vh-170px)] min-h-[480px]">
      {/* Sidebar */}
      <aside className={`${active ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 flex-col border-r border-slate-100`}>
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            <input className={inputCls} placeholder="Search chats & batchmates" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Button variant="light" className="px-3 shrink-0" onClick={() => setShowNewGroup(true)} title="New group">
              + Group
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className={`flex items-center gap-1 ${chat.connected ? "text-green-600" : "text-amber-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${chat.connected ? "bg-green-500" : "bg-amber-500"}`} />
              {chat.connected ? "Live" : "Reconnecting…"}
            </span>
            {notifPerm === "default" && (
              <button onClick={askNotif} className="text-blue-600 hover:underline">
                Enable notifications
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visibleConvs.map((c) => {
            const last = c.last_message;
            const preview = last
              ? `${last.sender_id === me.id ? "You: " : ""}${last.kind === "ping" ? "🔔 Ping" : last.body}`
              : c.type === "batch"
              ? "Say hello to your batch!"
              : c.type === "admin"
              ? "Questions? Message the IVIS LABS team"
              : "No messages yet";
            return (
              <button key={c.id} onClick={() => open(c.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 ${c.id === activeId ? "bg-blue-50" : ""}`}>
                {convAvatar(c)}
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.unread ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>{conversationTitle(c, me.id)}</span>
                    {last && <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(last.created_at)}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-xs ${c.unread ? "text-slate-800" : "text-slate-500"}`}>{preview}</span>
                    {c.unread > 0 && <span className="shrink-0 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{c.unread}</span>}
                  </span>
                </span>
              </button>
            );
          })}
          {newContacts.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-semibold text-slate-400 uppercase">Batchmates</div>
              {newContacts.map((p) => (
                <button key={p.id} onClick={() => startDm(p.id)} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                  <Avatar id={p.id} name={p.full_name} hasPhoto={p.has_photo} photoPath={`/api/interns/photo/${p.id}`} token={token} size={34} online={online.has(p.id)} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">{p.full_name}</span>
                    <span className="block text-xs text-slate-400 truncate">{online.has(p.id) ? "Online" : p.intern_code}</span>
                  </span>
                </button>
              ))}
            </>
          )}
          {!contacts.length && <div className="p-4 text-xs text-slate-400">No other interns in your batch yet.</div>}
        </div>
      </aside>

      {/* Thread */}
      <section className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {active ? (
          <Thread key={active.id} chat={chat} conv={active} me={me} contactById={contactById} avatar={convAvatar(active, 36)} onBack={() => open(null)} onError={alertError} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400 p-6 text-center">Pick a conversation or a batchmate to start chatting.</div>
        )}
        {(err || chat.error) && (
          <div className="p-2">
            <Alert>
              {err || chat.error}{" "}
              <button className="underline ml-1" onClick={() => setErr("")}>
                dismiss
              </button>
            </Alert>
          </div>
        )}
      </section>

      {showNewGroup && (
        <NewGroupDialog
          contacts={contacts}
          onClose={() => setShowNewGroup(false)}
          onCreate={async (name, ids) => {
            const id = await chat.createGroup(name, ids);
            setShowNewGroup(false);
            open(id);
          }}
        />
      )}
    </div>
  );
}

function Thread({ chat, conv, me, contactById, avatar, onBack, onError }) {
  const state = chat.messages[conv.id];
  const list = state ? state.list : [];
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pinging, setPinging] = useState(false);
  const scroller = useRef(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef(0);

  const onScroll = () => {
    const el = scroller.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    else if (prevHeight.current && el.scrollTop < 10) el.scrollTop = el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [list.length]);

  const submit = async (e) => {
    e && e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      stickToBottom.current = true;
      await chat.send(conv.id, body);
      setText("");
    } catch (err) {
      onError(err);
    } finally {
      setSending(false);
    }
  };

  const ping = async () => {
    setPinging(true);
    try {
      stickToBottom.current = true;
      await chat.ping(conv.id);
    } catch (err) {
      onError(err);
    } finally {
      setPinging(false);
    }
  };

  const subtitle = (() => {
    if (conv.type === "batch") return `${Object.keys(contactById).length + 1} interns · ${[...chat.online].filter((id) => contactById[id]).length + 1} online`;
    if (conv.type === "dm") {
      const other = (conv.members || []).find((m) => m.id !== me.id);
      return other && chat.online.has(other.id) ? "Online" : "Offline";
    }
    if (conv.type === "admin") return "Private chat with the IVIS LABS admins";
    return (conv.members || []).map((m) => (m.id === me.id ? "You" : m.full_name.split(" ")[0])).join(", ");
  })();
  const oneToOne = conv.type === "dm" || conv.type === "admin";

  let lastDay = "";
  return (
    <>
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-100">
        <button className="md:hidden text-slate-500 px-1 text-lg" onClick={onBack} aria-label="Back">
          ←
        </button>
        {avatar}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-slate-900 truncate">{conversationTitle(conv, me.id)}</div>
          <div className="text-xs text-slate-500 truncate">{subtitle}</div>
        </div>
        <Button variant="light" className="px-3" onClick={ping} disabled={pinging} title={oneToOne ? "Ping — buzz them with an alert" : "Ping everyone in this chat"}>
          🔔 Ping
        </Button>
        {conv.type === "group" && (
          <button
            className="text-xs text-slate-400 hover:text-red-600"
            onClick={() => window.confirm(`Leave "${conv.name}"?`) && chat.leaveGroup(conv.id).catch(onError)}
          >
            Leave
          </button>
        )}
      </div>

      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1 bg-slate-50">
        {state && state.hasMore && (
          <div className="text-center mb-2">
            <button className="text-xs text-blue-600 hover:underline" onClick={() => chat.loadOlder(conv.id).catch(onError)}>
              Load earlier messages
            </button>
          </div>
        )}
        {!state && <div className="text-center text-xs text-slate-400">Loading…</div>}
        {state && !list.length && <div className="text-center text-xs text-slate-400 mt-10">No messages yet — say hi 👋</div>}
        {list.map((m, idx) => {
          const day = fmtChatDay(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.sender_id === me.id;
          const prev = list[idx - 1];
          const showName = !mine && conv.type !== "dm" && (!prev || prev.sender_id !== m.sender_id || showDay);
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
                    🔔 {mine ? "You" : m.sender_name} pinged {oneToOne ? (mine ? "them" : "you") : "everyone"} · {fmtTime(m.created_at)}
                  </span>
                </div>
              ) : (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${mine ? "bg-blue-600 text-white rounded-br-md" : "bg-white text-slate-800 rounded-bl-md"}`}>
                    {showName && <div className="text-[11px] font-semibold text-indigo-600 mb-0.5">{m.sender_name}</div>}
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div className={`text-[10px] text-right ${mine ? "text-blue-100" : "text-slate-400"}`}>{fmtTime(m.created_at)}</div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 p-3 border-t border-slate-100">
        <textarea
          rows={1}
          className={`${inputCls} resize-none max-h-32`}
          placeholder="Type a message…"
          title="Enter to send · Shift+Enter for a new line"
          value={text}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button disabled={sending || !text.trim()}>Send</Button>
      </form>
    </>
  );
}

function NewGroupDialog({ contacts, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState(() => new Set());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const submit = async (e) => {
    e.preventDefault();
    if (!picked.size) return setErr("Pick at least one batchmate.");
    setBusy(true);
    try {
      await onCreate(name, [...picked]);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3">
        <div className="font-semibold text-slate-900">New group</div>
        <input className={inputCls} placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoFocus />
        <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
          {contacts.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
              {c.full_name}
            </label>
          ))}
          {!contacts.length && <div className="p-3 text-xs text-slate-400">No batchmates yet.</div>}
        </div>
        <Alert>{err}</Alert>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>Create</Button>
        </div>
      </form>
    </div>
  );
}
