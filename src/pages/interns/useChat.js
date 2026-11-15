import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, chatSocketUrl } from "../../services/internApi";

/* ---------------- Alerts: sound, vibration, desktop notification ---------------- */
let audioCtx = null;
function getAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (_) {
    return null;
  }
}
// Browsers only allow audio after a user gesture; unlock on the first click/key.
if (typeof window !== "undefined") {
  const unlock = () => {
    getAudio();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function tone(freqs, gap = 0.12, dur = 0.12, vol = 0.15) {
  const ctx = getAudio();
  if (!ctx) return;
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = f;
    o.type = "sine";
    const t = ctx.currentTime + i * gap;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  });
}
const playMessage = () => tone([880, 1175], 0.09, 0.1, 0.08);
const playPing = () => tone([988, 1319, 988, 1319], 0.14, 0.13, 0.2);

function desktopNotify(title, body, tag) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
    const n = new Notification(title, { body, tag, icon: "/favicon.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (_) {
    /* unsupported */
  }
}

export function conversationTitle(c, meId) {
  if (!c) return "";
  if (c.type === "batch") return `${c.name} · Batch chat`;
  if (c.type === "dm") {
    const other = (c.members || []).find((m) => m.id !== meId);
    return other ? other.full_name : "Direct message";
  }
  return c.name;
}

/**
 * Chat state for the whole dashboard (so unread badges and ping alerts work on
 * every tab). Real-time via WebSocket; falls back to polling while disconnected
 * and re-syncs missed messages after a reconnect.
 */
export default function useChat(token, meId) {
  const [contacts, setContacts] = useState([]);
  const [online, setOnline] = useState(() => new Set());
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({}); // convId -> { list, hasMore, loaded }
  const [activeId, setActiveIdState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [pingAlert, setPingAlert] = useState(null);

  const activeRef = useRef(null);
  const messagesRef = useRef({});
  const convsRef = useRef([]);
  messagesRef.current = messages;
  convsRef.current = conversations;

  const bootstrap = useCallback(async () => {
    try {
      const r = await api("/api/chat/bootstrap", { token });
      setContacts(r.contacts);
      setOnline(new Set(r.online));
      setConversations((prev) => {
        // Keep the open conversation's unread at 0 locally.
        return r.conversations.map((c) => (c.id === activeRef.current && !document.hidden ? { ...c, unread: 0 } : c));
      });
      setError("");
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [token]);

  const markRead = useCallback(
    (convId, lastId) => {
      if (!lastId) return;
      setConversations((cs) => cs.map((c) => (c.id === convId ? { ...c, unread: 0, last_read_id: Math.max(c.last_read_id || 0, lastId) } : c)));
      api(`/api/chat/conversations/${convId}/read`, { method: "POST", body: { lastId }, token }).catch(() => {});
    },
    [token]
  );

  const appendMessages = useCallback((convId, incoming) => {
    setMessages((all) => {
      const cur = all[convId];
      if (!cur) return all;
      const seen = new Set(cur.list.map((m) => m.id));
      const add = incoming.filter((m) => !seen.has(m.id));
      if (!add.length) return all;
      return { ...all, [convId]: { ...cur, list: [...cur.list, ...add].sort((a, b) => a.id - b.id) } };
    });
  }, []);

  const handleIncoming = useCallback(
    (m) => {
      appendMessages(m.conversation_id, [m]);
      const known = convsRef.current.some((c) => c.id === m.conversation_id);
      if (!known) {
        bootstrap();
      } else {
        setConversations((cs) => {
          const next = cs.map((c) => {
            if (c.id !== m.conversation_id) return c;
            const viewing = activeRef.current === c.id && !document.hidden;
            return {
              ...c,
              last_message: m,
              last_message_at: m.created_at,
              unread: m.sender_id === meId || viewing ? c.unread : (c.unread || 0) + 1,
            };
          });
          return next.sort((a, b) => ((b.last_message_at || b.created_at) > (a.last_message_at || a.created_at) ? 1 : -1));
        });
      }
      if (m.sender_id === meId) return;
      const viewing = activeRef.current === m.conversation_id && !document.hidden;
      if (viewing) markRead(m.conversation_id, m.id);
      const conv = convsRef.current.find((c) => c.id === m.conversation_id);
      const where = conv && conv.type !== "dm" ? ` in ${conv.name}` : "";
      if (m.kind === "ping") {
        playPing();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setPingAlert({ ...m, where, at: Date.now() });
        desktopNotify(`🔔 ${m.sender_name} pinged you${where}`, "Open the IVIS LABS intern portal to respond.", `ping-${m.conversation_id}`);
      } else if (!viewing) {
        playMessage();
        desktopNotify(`${m.sender_name}${where}`, m.body.slice(0, 140), `msg-${m.conversation_id}`);
      }
    },
    [appendMessages, bootstrap, markRead, meId]
  );

  // Re-fetch anything missed while disconnected.
  const resync = useCallback(async () => {
    await bootstrap();
    for (const [cid, st] of Object.entries(messagesRef.current)) {
      const lastId = st.list.length ? st.list[st.list.length - 1].id : 0;
      try {
        const r = await api(`/api/chat/conversations/${cid}/messages${lastId ? `?after=${lastId}` : ""}`, { token });
        appendMessages(Number(cid), r.messages);
      } catch (_) {
        /* ignore */
      }
    }
  }, [bootstrap, appendMessages, token]);

  /* ---------------- WebSocket with reconnect ---------------- */
  useEffect(() => {
    if (!token) return undefined;
    let ws = null;
    let stopped = false;
    let retry = 0;
    let keepAlive = null;
    let reconnectTimer = null;
    let first = true;

    const connect = () => {
      if (stopped) return;
      try {
        ws = new WebSocket(chatSocketUrl(token));
      } catch (_) {
        schedule();
        return;
      }
      ws.onopen = () => {
        retry = 0;
        setConnected(true);
        keepAlive = setInterval(() => ws && ws.readyState === 1 && ws.send("ping"), 25000);
        if (!first) resync();
        first = false;
      };
      ws.onmessage = (e) => {
        if (e.data === "pong") return;
        let ev;
        try {
          ev = JSON.parse(e.data);
        } catch (_) {
          return;
        }
        if (ev.type === "hello") setOnline(new Set(ev.online));
        else if (ev.type === "presence")
          setOnline((s) => {
            const n = new Set(s);
            if (ev.online) n.add(ev.uid);
            else n.delete(ev.uid);
            return n;
          });
        else if (ev.type === "message") handleIncoming(ev.message);
        else if (ev.type === "conversation") bootstrap();
      };
      ws.onclose = () => {
        setConnected(false);
        clearInterval(keepAlive);
        schedule();
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch (_) {
          /* ignore */
        }
      };
    };
    const schedule = () => {
      if (stopped) return;
      retry += 1;
      reconnectTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(retry, 5)));
    };

    bootstrap();
    connect();
    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      clearInterval(keepAlive);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Polling fallback while the socket is down.
  useEffect(() => {
    if (connected || !token) return undefined;
    const t = setInterval(resync, 15000);
    return () => clearInterval(t);
  }, [connected, token, resync]);

  // When the tab becomes visible again, mark the open conversation read.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden || !activeRef.current) return;
      const st = messagesRef.current[activeRef.current];
      if (st && st.list.length) markRead(activeRef.current, st.list[st.list.length - 1].id);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [markRead]);

  /* ---------------- Actions ---------------- */
  const loadMessages = useCallback(
    async (convId, older = false) => {
      const cur = messagesRef.current[convId];
      if (cur && cur.loaded && !older) return cur;
      const before = older && cur && cur.list.length ? cur.list[0].id : 0;
      const r = await api(`/api/chat/conversations/${convId}/messages${before ? `?before=${before}` : ""}`, { token });
      setMessages((all) => {
        const prev = all[convId];
        const merged = older && prev ? [...r.messages, ...prev.list] : r.messages;
        const uniq = [...new Map(merged.map((m) => [m.id, m])).values()].sort((a, b) => a.id - b.id);
        return { ...all, [convId]: { list: uniq, hasMore: r.hasMore, loaded: true } };
      });
      return r;
    },
    [token]
  );

  const setActiveId = useCallback(
    async (convId) => {
      activeRef.current = convId;
      setActiveIdState(convId);
      if (!convId) return;
      try {
        const r = await loadMessages(convId);
        const list = (r && (r.list || r.messages)) || [];
        if (list.length) markRead(convId, list[list.length - 1].id);
        else setConversations((cs) => cs.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)));
      } catch (e) {
        setError(e.message);
      }
    },
    [loadMessages, markRead]
  );

  const send = useCallback(
    async (convId, body) => {
      const r = await api(`/api/chat/conversations/${convId}/messages`, { method: "POST", body: { body }, token });
      handleIncoming(r.message);
      return r.message;
    },
    [token, handleIncoming]
  );

  const ping = useCallback(
    async (convId) => {
      const r = await api(`/api/chat/conversations/${convId}/ping`, { method: "POST", token });
      handleIncoming(r.message);
    },
    [token, handleIncoming]
  );

  const startDm = useCallback(
    async (contactId) => {
      const r = await api("/api/chat/conversations", { method: "POST", body: { type: "dm", with: contactId }, token });
      await bootstrap();
      return r.id;
    },
    [token, bootstrap]
  );

  const createGroup = useCallback(
    async (name, members) => {
      const r = await api("/api/chat/conversations", { method: "POST", body: { type: "group", name, members }, token });
      await bootstrap();
      return r.id;
    },
    [token, bootstrap]
  );

  const leaveGroup = useCallback(
    async (convId) => {
      await api(`/api/chat/conversations/${convId}/leave`, { method: "POST", token });
      if (activeRef.current === convId) setActiveId(null);
      await bootstrap();
    },
    [token, bootstrap, setActiveId]
  );

  const totalUnread = useMemo(() => conversations.reduce((n, c) => n + (c.unread || 0), 0), [conversations]);

  return {
    contacts,
    online,
    conversations,
    messages,
    activeId,
    setActiveId,
    loadOlder: (id) => loadMessages(id, true),
    send,
    ping,
    startDm,
    createGroup,
    leaveGroup,
    connected,
    error,
    totalUnread,
    pingAlert,
    dismissPing: () => setPingAlert(null),
  };
}
