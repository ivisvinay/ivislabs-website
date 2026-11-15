/**
 * ChatHub — a single Durable Object that holds every intern's open WebSocket
 * and fans out real-time events (new messages, pings, presence).
 *
 * Messages themselves are stored in D1 by the main Worker; the hub only
 * delivers them. It uses the WebSocket Hibernation API, so idle connections
 * cost nothing, and answers the client's "ping" keep-alive without waking up.
 *
 * Internal endpoints (only reachable from the Worker via the CHAT binding):
 *   GET  /connect?uid=<id>   upgrade to a WebSocket for that intern
 *   POST /broadcast          { to: [ids], event: {...} }
 *   GET  /online             -> [ids currently connected]
 */
export class ChatHub {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  onlineIds() {
    const ids = new Set();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a && a.uid) ids.add(a.uid);
    }
    return ids;
  }

  sendTo(ids, event) {
    const msg = JSON.stringify(event);
    for (const id of ids) {
      for (const ws of this.ctx.getWebSockets(`u:${id}`)) {
        try {
          ws.send(msg);
        } catch (_) {
          /* socket already closing */
        }
      }
    }
  }

  sendAll(event, exceptUid) {
    const msg = JSON.stringify(event);
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a && a.uid === exceptUid) continue;
      try {
        ws.send(msg);
      } catch (_) {
        /* ignore */
      }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/connect") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected websocket", { status: 426 });
      }
      const uid = Number(url.searchParams.get("uid"));
      const wasOnline = this.onlineIds().has(uid);
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, [`u:${uid}`]);
      server.serializeAttachment({ uid });
      server.send(JSON.stringify({ type: "hello", online: [...this.onlineIds()] }));
      if (!wasOnline) this.sendAll({ type: "presence", uid, online: true }, uid);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/broadcast" && request.method === "POST") {
      const { to, event } = await request.json();
      this.sendTo(to || [], event);
      return new Response("ok");
    }

    if (url.pathname === "/online") {
      return Response.json([...this.onlineIds()]);
    }

    return new Response("Not found", { status: 404 });
  }

  // Clients only send keep-alives (auto-answered); everything else goes through
  // the authenticated HTTP API, so incoming frames are ignored.
  webSocketMessage() {}

  webSocketClose(ws, code, reason) {
    this.handleGone(ws);
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, reason);
    } catch (_) {
      /* already closed */
    }
  }

  webSocketError(ws) {
    this.handleGone(ws);
  }

  handleGone(ws) {
    const a = ws.deserializeAttachment();
    if (!a || !a.uid) return;
    const stillOnline = this.ctx
      .getWebSockets(`u:${a.uid}`)
      .some((s) => s !== ws && s.readyState === WebSocket.OPEN);
    if (!stillOnline) this.sendAll({ type: "presence", uid: a.uid, online: false }, a.uid);
  }
}
