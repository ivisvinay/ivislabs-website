/**
 * IVIS LABS Intern Portal API (D1 + R2 + ChatHub Durable Object).
 *
 *   Public   POST /api/interns/register, POST /api/interns/login
 *            GET  /intern-id/<verifyToken>          ID-card verification page
 *   Intern   /api/interns/me…, /api/interns/reports…, /api/chat/…
 *   Admin    /api/admin/login, /api/admin/interns…, /api/admin/batches…
 *
 * Intern sessions are HMAC-signed bearer tokens carrying the intern id and
 * token_version; bumping token_version (password change/reset) revokes them.
 */
import {
  HttpError,
  json,
  esc,
  base64ToBytes,
  randomToken,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  bearer,
  adminLogin,
  adminFromToken,
  todayIST,
  isISODate,
  addDays,
  endDateFor,
  nowISO,
  pageShell,
  htmlResponse,
  corsHeaders,
} from "./lib.js";

/* ------------------------------------------------------------------ */
/* Options (keep in sync with src/config/internOptions.js)             */
/* ------------------------------------------------------------------ */
export const DEGREES = ["Diploma", "B.C.A", "B.Sc", "B.B.A", "B.Com", "B.A", "M.Sc", "M.C.A", "M.B.A", "M.Com", "B.E", "B.Tech"];
export const SPECIALIZATIONS = ["Computer Science (All CS Branches)", "HR", "Finance", "Marketing", "Others"];
export const DURATIONS = { "1m": 1, "2m": 2, "3m": 3, "4m": 4, "6m": 6, "12m": 12 };
const DURATION_LABELS = { "1m": "1 Month", "2m": "2 Months", "3m": "3 Months", "4m": "4 Months", "6m": "6 Months", "12m": "1 Year" };
const STATUSES = ["pending", "approved", "rejected", "suspended"];

/** Reports can be submitted/edited for today and this many previous days. */
const REPORT_GRACE_DAYS = 2;
const INTERN_TOKEN_TTL = 30 * 24 * 3600;

/* ------------------------------------------------------------------ */
/* Schema (created lazily on first request; every statement idempotent) */
/* ------------------------------------------------------------------ */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS batches (
     id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS interns (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT NOT NULL UNIQUE, pw_hash TEXT NOT NULL, pw_salt TEXT NOT NULL,
     token_version INTEGER NOT NULL DEFAULT 0,
     full_name TEXT NOT NULL, phone TEXT NOT NULL, whatsapp TEXT, dob TEXT, gender TEXT,
     college TEXT NOT NULL, university TEXT, degree TEXT NOT NULL,
     specialization TEXT NOT NULL, specialization_other TEXT,
     year_of_study TEXT, graduation_year TEXT, city TEXT, state TEXT, address TEXT,
     domain TEXT, skills TEXT, linkedin TEXT, github TEXT, referral TEXT,
     emergency_name TEXT, emergency_phone TEXT,
     duration TEXT NOT NULL, preferred_start TEXT,
     status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT,
     batch_id INTEGER, start_date TEXT, end_date TEXT,
     intern_code TEXT UNIQUE, verify_token TEXT UNIQUE,
     photo_key TEXT, photo_updated_at TEXT,
     created_at TEXT NOT NULL, approved_at TEXT, approved_by TEXT, updated_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_interns_status ON interns(status)`,
  `CREATE INDEX IF NOT EXISTS idx_interns_batch ON interns(batch_id)`,
  `CREATE TABLE IF NOT EXISTS reports (
     id INTEGER PRIMARY KEY AUTOINCREMENT, intern_id INTEGER NOT NULL, date TEXT NOT NULL,
     activities TEXT NOT NULL, learnings TEXT, blockers TEXT, plan_next TEXT, hours REAL, links TEXT,
     admin_comment TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
     UNIQUE(intern_id, date))`,
  `CREATE TABLE IF NOT EXISTS conversations (
     id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, batch_id INTEGER, name TEXT,
     dm_key TEXT UNIQUE, created_by INTEGER, created_at TEXT NOT NULL, last_message_at TEXT)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_batch ON conversations(batch_id) WHERE type = 'batch'`,
  `CREATE TABLE IF NOT EXISTS conv_members (
     conversation_id INTEGER NOT NULL, intern_id INTEGER NOT NULL,
     PRIMARY KEY (conversation_id, intern_id))`,
  `CREATE INDEX IF NOT EXISTS idx_members_intern ON conv_members(intern_id)`,
  `CREATE TABLE IF NOT EXISTS conv_reads (
     conversation_id INTEGER NOT NULL, intern_id INTEGER NOT NULL, last_read_id INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (conversation_id, intern_id))`,
  `CREATE TABLE IF NOT EXISTS messages (
     id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, sender_id INTEGER NOT NULL,
     kind TEXT NOT NULL DEFAULT 'text', body TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date)`,
];
// Columns added after the first release (ALTER TABLE has no IF NOT EXISTS).
const SCHEMA_ADDITIONS = [
  // Messages written by an admin have sender_id = 0 and the admin's username here.
  `ALTER TABLE messages ADD COLUMN sender_admin TEXT`,
];

let schemaReady = null;
function ensureSchema(env) {
  if (!env.DB) throw new HttpError(500, "Server not configured (DB binding missing)");
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)))
      .then(async () => {
        for (const sql of SCHEMA_ADDITIONS) {
          await env.DB.prepare(sql)
            .run()
            .catch((e) => {
              if (!/duplicate column/i.test(String(e.message))) throw e;
            });
        }
      })
      .catch((e) => {
        schemaReady = null;
        throw e;
      });
  }
  return schemaReady;
}

/* ------------------------------------------------------------------ */
/* Profile validation                                                  */
/* ------------------------------------------------------------------ */
// [column, required at registration, max length]
const PROFILE_FIELDS = [
  ["full_name", true, 120],
  ["email", true, 160],
  ["phone", true, 20],
  ["whatsapp", false, 20],
  ["dob", true, 10],
  ["gender", false, 20],
  ["college", true, 200],
  ["university", false, 200],
  ["degree", true, 20],
  ["specialization", true, 60],
  ["specialization_other", false, 120],
  ["year_of_study", true, 30],
  ["graduation_year", false, 4],
  ["city", true, 80],
  ["state", false, 80],
  ["address", false, 400],
  ["domain", false, 120],
  ["skills", false, 500],
  ["linkedin", false, 200],
  ["github", false, 200],
  ["referral", false, 120],
  ["emergency_name", true, 120],
  ["emergency_phone", true, 20],
  ["duration", true, 4],
  ["preferred_start", true, 10],
];
const INTERN_EDITABLE = [
  "phone", "whatsapp", "city", "state", "address", "skills", "linkedin", "github",
  "emergency_name", "emergency_phone",
];
const PHONE_RE = /^\+?[0-9][0-9 -]{8,17}[0-9]$/;

function cleanProfile(body, keys, requireAll) {
  const out = {};
  for (const [key, required, max] of PROFILE_FIELDS) {
    if (!keys.includes(key)) continue;
    let v = body[key];
    v = v == null ? "" : String(v).trim();
    if (!v) {
      if (required && requireAll) throw new HttpError(400, `Missing: ${key.replace(/_/g, " ")}`);
      out[key] = null;
      continue;
    }
    if (v.length > max) throw new HttpError(400, `${key.replace(/_/g, " ")} is too long`);
    out[key] = v;
  }
  if (out.email !== undefined && out.email !== null) {
    out.email = out.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new HttpError(400, "Invalid email address");
  }
  for (const k of ["phone", "whatsapp", "emergency_phone"]) {
    if (out[k] && !PHONE_RE.test(out[k])) throw new HttpError(400, `Invalid ${k.replace(/_/g, " ")}`);
  }
  if (out.degree !== undefined && !DEGREES.includes(out.degree)) throw new HttpError(400, "Invalid degree");
  if (out.specialization !== undefined) {
    if (!SPECIALIZATIONS.includes(out.specialization)) throw new HttpError(400, "Invalid specialization");
    if (out.specialization === "Others" && !out.specialization_other)
      throw new HttpError(400, "Please specify your specialization");
    if (out.specialization !== "Others") out.specialization_other = null;
  }
  if (out.duration !== undefined && !DURATIONS[out.duration]) throw new HttpError(400, "Invalid duration");
  for (const k of ["dob", "preferred_start"]) {
    if (out[k] && !isISODate(out[k])) throw new HttpError(400, `Invalid ${k.replace(/_/g, " ")}`);
  }
  if (out.graduation_year && !/^\d{4}$/.test(out.graduation_year))
    throw new HttpError(400, "Invalid graduation year");
  return out;
}

/* ------------------------------------------------------------------ */
/* Serialisation                                                       */
/* ------------------------------------------------------------------ */
const PRIVATE_COLS = ["pw_hash", "pw_salt", "token_version", "photo_key"];

function publicIntern(row) {
  if (!row) return null;
  const o = {};
  for (const k of Object.keys(row)) if (!PRIVATE_COLS.includes(k)) o[k] = row[k];
  o.has_photo = !!row.photo_key;
  o.duration_label = DURATION_LABELS[row.duration] || row.duration;
  return o;
}

function istDateOf(isoTs) {
  return new Date(new Date(isoTs).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

function serializeReport(r) {
  return { ...r, late: istDateOf(r.created_at) > r.date };
}

/* ------------------------------------------------------------------ */
/* Auth helpers                                                        */
/* ------------------------------------------------------------------ */
async function issueInternToken(env, row) {
  return signToken(env, { sub: row.id, role: "intern", v: row.token_version }, INTERN_TOKEN_TTL);
}

async function requireIntern(request, env, { approved = true, token } = {}) {
  const p = await verifyToken(env, token || bearer(request));
  if (!p || p.role !== "intern") throw new HttpError(401, "Please sign in again");
  const row = await env.DB.prepare("SELECT * FROM interns WHERE id = ?").bind(p.sub).first();
  if (!row || row.token_version !== p.v) throw new HttpError(401, "Session expired, please sign in again");
  if (approved && row.status !== "approved") throw new HttpError(403, "Your account is not active");
  return row;
}

async function requireAdmin(request, env) {
  const admin = await adminFromToken(request, env);
  if (!admin) throw new HttpError(401, "Admin sign-in required");
  return admin;
}

async function readJson(request) {
  try {
    return (await request.json()) || {};
  } catch (_) {
    throw new HttpError(400, "Invalid JSON body");
  }
}

/* ------------------------------------------------------------------ */
/* Chat helpers                                                        */
/* ------------------------------------------------------------------ */
function hub(env) {
  return env.CHAT ? env.CHAT.get(env.CHAT.idFromName("hub")) : null;
}

function broadcast(env, ctx, to, event) {
  const h = hub(env);
  if (!h || !to.length) return;
  const p = h
    .fetch("https://hub/broadcast", { method: "POST", body: JSON.stringify({ to, event }) })
    .catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p);
}

/** Different events to different interns in one hub round-trip: [{ to, event }]. */
function broadcastMany(env, ctx, items) {
  const h = hub(env);
  if (!h || !items.length) return;
  const p = h
    .fetch("https://hub/broadcast", { method: "POST", body: JSON.stringify({ items }) })
    .catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p);
}

async function onlineIds(env) {
  const h = hub(env);
  if (!h) return [];
  try {
    return await (await h.fetch("https://hub/online")).json();
  } catch (_) {
    return [];
  }
}

async function ensureBatchChannel(env, batchId) {
  const b = await env.DB.prepare("SELECT * FROM batches WHERE id = ?").bind(batchId).first();
  if (!b) throw new HttpError(400, "Batch not found");
  await env.DB.prepare(
    "INSERT OR IGNORE INTO conversations (type, batch_id, name, created_at) VALUES ('batch', ?, ?, ?)"
  )
    .bind(b.id, b.name, nowISO())
    .run();
  return b;
}

async function getConversation(env, intern, convId) {
  const c = await env.DB.prepare("SELECT * FROM conversations WHERE id = ?").bind(convId).first();
  if (!c) throw new HttpError(404, "Conversation not found");
  if (c.type === "batch") {
    if (c.batch_id !== intern.batch_id) throw new HttpError(403, "Not a member of this conversation");
  } else {
    const m = await env.DB.prepare("SELECT 1 FROM conv_members WHERE conversation_id = ? AND intern_id = ?")
      .bind(c.id, intern.id)
      .first();
    if (!m) throw new HttpError(403, "Not a member of this conversation");
  }
  return c;
}

async function conversationRecipients(env, c) {
  const q =
    c.type === "batch"
      ? env.DB.prepare("SELECT id FROM interns WHERE batch_id = ? AND status = 'approved'").bind(c.batch_id)
      : env.DB.prepare("SELECT intern_id AS id FROM conv_members WHERE conversation_id = ?").bind(c.id);
  return (await q.all()).results.map((r) => r.id);
}

async function batchmates(env, intern) {
  if (!intern.batch_id) return [];
  return (
    await env.DB.prepare(
      `SELECT id, full_name, intern_code, degree, specialization, specialization_other,
              photo_key IS NOT NULL AS has_photo
         FROM interns WHERE batch_id = ? AND status = 'approved' AND id <> ? ORDER BY full_name`
    )
      .bind(intern.batch_id, intern.id)
      .all()
  ).results;
}

async function postMessage(env, ctx, intern, c, kind, body) {
  const created = nowISO();
  const res = await env.DB.prepare(
    "INSERT INTO messages (conversation_id, sender_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id"
  )
    .bind(c.id, intern.id, kind, body, created)
    .first();
  await env.DB.batch([
    env.DB.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").bind(created, c.id),
    env.DB.prepare(
      `INSERT INTO conv_reads (conversation_id, intern_id, last_read_id) VALUES (?, ?, ?)
       ON CONFLICT(conversation_id, intern_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)`
    ).bind(c.id, intern.id, res.id),
  ]);
  const message = {
    id: res.id,
    conversation_id: c.id,
    sender_id: intern.id,
    sender_name: intern.full_name,
    kind,
    body,
    created_at: created,
  };
  broadcast(env, ctx, await conversationRecipients(env, c), { type: "message", message });
  return message;
}

/* ---------------- Admin ↔ intern conversations ----------------
 * Each intern has one private conversation (type 'admin', dm_key 'admin:<id>')
 * with the IVIS LABS team. Admin messages are stored with sender_id = 0 and the
 * admin's username in sender_admin. Admin read state is shared by all admins
 * and kept in conv_reads with intern_id = 0.
 */
const ADMIN_CONV_NAME = "IVIS LABS Team";
const adminConvKey = (internId) => `admin:${internId}`;
const ADMIN_UID = 0;

function adminSenderName(username) {
  const u = String(username || "admin");
  return `${u.charAt(0).toUpperCase()}${u.slice(1)} (IVIS LABS)`;
}

function withSenderNames(rows) {
  return rows.map((r) => (r.sender_id === ADMIN_UID ? { ...r, sender_name: adminSenderName(r.sender_admin) } : r));
}

function ensureAdminConvStmts(env, internId, created) {
  const k = adminConvKey(internId);
  return [
    env.DB.prepare("INSERT OR IGNORE INTO conversations (type, name, dm_key, created_at) VALUES ('admin', ?, ?, ?)").bind(
      ADMIN_CONV_NAME,
      k,
      created
    ),
    env.DB.prepare("INSERT OR IGNORE INTO conv_members (conversation_id, intern_id) SELECT id, ? FROM conversations WHERE dm_key = ?").bind(
      internId,
      k
    ),
  ];
}

/** Post the same admin message into each intern's private admin conversation. */
async function adminSend(env, ctx, admin, internIds, kind, body) {
  const created = nowISO();
  const events = [];
  const PER_BATCH = 20; // 4 statements each
  for (let i = 0; i < internIds.length; i += PER_BATCH) {
    const chunk = internIds.slice(i, i + PER_BATCH);
    const stmts = [];
    for (const id of chunk) {
      const k = adminConvKey(id);
      stmts.push(
        ...ensureAdminConvStmts(env, id, created),
        env.DB.prepare(
          `INSERT INTO messages (conversation_id, sender_id, sender_admin, kind, body, created_at)
           SELECT id, 0, ?, ?, ?, ? FROM conversations WHERE dm_key = ? RETURNING id, conversation_id`
        ).bind(admin, kind, body, created, k),
        env.DB.prepare("UPDATE conversations SET last_message_at = ? WHERE dm_key = ?").bind(created, k)
      );
    }
    const res = await env.DB.batch(stmts);
    chunk.forEach((id, j) => {
      const row = res[j * 4 + 2].results && res[j * 4 + 2].results[0];
      if (!row) return;
      events.push({
        to: [id],
        event: {
          type: "message",
          message: {
            id: row.id,
            conversation_id: row.conversation_id,
            sender_id: ADMIN_UID,
            sender_admin: admin,
            sender_name: adminSenderName(admin),
            kind,
            body,
            created_at: created,
          },
        },
      });
    });
  }
  broadcastMany(env, ctx, events);
  return events.map((e) => e.event.message);
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */
async function servePhoto(env, row, request) {
  if (!row || !row.photo_key) return new Response("Not found", { status: 404 });
  const obj = await env.CERTS.get(row.photo_key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "private, max-age=300",
      ...corsHeaders(request),
    },
  });
}

/* ------------------------------------------------------------------ */
/* Report helpers                                                      */
/* ------------------------------------------------------------------ */
function cleanReport(body) {
  const s = (v, max) => {
    const t = v == null ? "" : String(v).trim();
    if (t.length > max) throw new HttpError(400, "Report field too long");
    return t || null;
  };
  const activities = s(body.activities, 5000);
  if (!activities || activities.length < 10)
    throw new HttpError(400, "Please describe the activities you performed (at least 10 characters)");
  let hours = body.hours === "" || body.hours == null ? null : Number(body.hours);
  if (hours !== null && (!isFinite(hours) || hours < 0 || hours > 24)) throw new HttpError(400, "Hours must be 0–24");
  return {
    activities,
    learnings: s(body.learnings, 3000),
    blockers: s(body.blockers, 3000),
    plan_next: s(body.plan_next, 3000),
    links: s(body.links, 1000),
    hours,
  };
}

/* ------------------------------------------------------------------ */
/* Intern code / approval                                              */
/* ------------------------------------------------------------------ */
async function nextInternCode(env, year) {
  const prefix = `IVIS-INT-${year}-`;
  const r = await env.DB.prepare(
    "SELECT intern_code FROM interns WHERE intern_code LIKE ? ORDER BY intern_code DESC LIMIT 1"
  )
    .bind(prefix + "%")
    .first();
  const n = r ? parseInt(r.intern_code.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(n).padStart(4, "0");
}

function scheduleFrom(body, row) {
  const start = body.start_date !== undefined ? String(body.start_date || "") : row.start_date;
  if (!isISODate(start)) throw new HttpError(400, "A valid start date is required");
  let end = body.end_date ? String(body.end_date) : null;
  if (!end) {
    // Recompute end only when the start moved or no end is set yet.
    end = body.start_date !== undefined || !row.end_date ? endDateFor(start, DURATIONS[row.duration] || 1) : row.end_date;
  }
  if (!isISODate(end) || end < start) throw new HttpError(400, "End date must be on or after the start date");
  return { start, end };
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */
const routes = [];
function route(method, pattern, handler) {
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$");
  routes.push({ method, re, handler });
}

/** Returns a Response if the path belongs to the intern portal, else null. */
export async function handleInterns(request, env, ctx, url, path) {
  if (!(path.startsWith("/api/interns") || path.startsWith("/api/chat") || path.startsWith("/api/admin/") || path.startsWith("/intern-id/"))) {
    return null;
  }
  for (const r of routes) {
    if (r.method !== request.method) continue;
    const m = path.match(r.re);
    if (!m) continue;
    await ensureSchema(env);
    return r.handler({ request, env, ctx, url, params: m.groups || {} });
  }
  return json({ ok: false, error: "Not found" }, 404, request);
}

/* ---------------- Public ---------------- */

route("POST", "/api/interns/register", async ({ request, env }) => {
  const body = await readJson(request);
  const profile = cleanProfile(body, PROFILE_FIELDS.map((f) => f[0]), true);
  const password = String(body.password || "");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  if (!body.consent) throw new HttpError(400, "Please accept the declaration");
  const { hash, salt } = await hashPassword(password);
  const cols = Object.keys(profile);
  try {
    await env.DB.prepare(
      `INSERT INTO interns (${cols.join(", ")}, pw_hash, pw_salt, status, created_at)
       VALUES (${cols.map(() => "?").join(", ")}, ?, ?, 'pending', ?)`
    )
      .bind(...cols.map((c) => profile[c]), hash, salt, nowISO())
      .run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) throw new HttpError(409, "An account with this email already exists");
    throw e;
  }
  return json({ ok: true }, 201, request);
});

route("POST", "/api/interns/login", async ({ request, env }) => {
  const { email, password } = await readJson(request);
  const row = await env.DB.prepare("SELECT * FROM interns WHERE email = ?")
    .bind(String(email || "").trim().toLowerCase())
    .first();
  // Always run the hash so response time doesn't reveal whether the email exists.
  const ok = row
    ? await verifyPassword(String(password || ""), row.pw_salt, row.pw_hash)
    : (await hashPassword(String(password || "")), false);
  if (!ok) throw new HttpError(401, "Invalid email or password");
  return json({ ok: true, token: await issueInternToken(env, row), intern: publicIntern(row) }, 200, request);
});

route("GET", "/intern-id/:token", async ({ request, env, params, url }) => {
  const row = await env.DB.prepare(
    "SELECT i.*, b.name AS batch_name FROM interns i LEFT JOIN batches b ON b.id = i.batch_id WHERE verify_token = ?"
  )
    .bind(params.token)
    .first();
  return internVerifyPage(row, url.origin, params.token);
});

route("GET", "/intern-id/:token/photo", async ({ request, env, params }) => {
  const row = await env.DB.prepare("SELECT * FROM interns WHERE verify_token = ? AND status = 'approved'")
    .bind(params.token)
    .first();
  return servePhoto(env, row, request);
});

/* ---------------- Intern: self ---------------- */

async function meResponse(env, row, request) {
  const batch = row.batch_id
    ? await env.DB.prepare("SELECT id, name FROM batches WHERE id = ?").bind(row.batch_id).first()
    : null;
  return json({ ok: true, intern: publicIntern(row), batch, today: todayIST(), graceDays: REPORT_GRACE_DAYS }, 200, request);
}

route("GET", "/api/interns/me", async ({ request, env }) => {
  const row = await requireIntern(request, env, { approved: false });
  return meResponse(env, row, request);
});

route("PUT", "/api/interns/me", async ({ request, env }) => {
  const row = await requireIntern(request, env, { approved: false });
  const body = await readJson(request);
  const patch = cleanProfile(body, INTERN_EDITABLE.filter((k) => k in body), false);
  for (const k of ["phone", "emergency_name", "emergency_phone"]) {
    if (k in patch && !patch[k]) throw new HttpError(400, `${k.replace(/_/g, " ")} is required`);
  }
  const cols = Object.keys(patch);
  if (cols.length) {
    await env.DB.prepare(`UPDATE interns SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
      .bind(...cols.map((c) => patch[c]), nowISO(), row.id)
      .run();
  }
  const fresh = await env.DB.prepare("SELECT * FROM interns WHERE id = ?").bind(row.id).first();
  return meResponse(env, fresh, request);
});

route("POST", "/api/interns/me/password", async ({ request, env }) => {
  const row = await requireIntern(request, env, { approved: false });
  const { current, next } = await readJson(request);
  if (!(await verifyPassword(String(current || ""), row.pw_salt, row.pw_hash)))
    throw new HttpError(400, "Current password is incorrect");
  if (String(next || "").length < 8) throw new HttpError(400, "New password must be at least 8 characters");
  const { hash, salt } = await hashPassword(String(next));
  const v = row.token_version + 1;
  await env.DB.prepare("UPDATE interns SET pw_hash = ?, pw_salt = ?, token_version = ?, updated_at = ? WHERE id = ?")
    .bind(hash, salt, v, nowISO(), row.id)
    .run();
  return json({ ok: true, token: await issueInternToken(env, { ...row, token_version: v }) }, 200, request);
});

route("POST", "/api/interns/me/photo", async ({ request, env }) => {
  const row = await requireIntern(request, env);
  const { image } = await readJson(request);
  const m = /^data:(image\/(jpeg|png));base64,(.+)$/.exec(String(image || ""));
  if (!m) throw new HttpError(400, "Upload a JPEG or PNG image");
  const bytes = base64ToBytes(m[3]);
  if (bytes.length > 1.5 * 1024 * 1024) throw new HttpError(400, "Photo must be under 1.5 MB");
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  if (!isJpeg && !isPng) throw new HttpError(400, "File is not a valid image");
  const key = `interns/photos/${row.id}.${isPng ? "png" : "jpg"}`;
  await env.CERTS.put(key, bytes, { httpMetadata: { contentType: isPng ? "image/png" : "image/jpeg" } });
  if (row.photo_key && row.photo_key !== key) await env.CERTS.delete(row.photo_key);
  await env.DB.prepare("UPDATE interns SET photo_key = ?, photo_updated_at = ?, updated_at = ? WHERE id = ?")
    .bind(key, nowISO(), nowISO(), row.id)
    .run();
  return json({ ok: true }, 200, request);
});

route("GET", "/api/interns/photo/:id", async ({ request, env, params }) => {
  const me = await requireIntern(request, env, { approved: false });
  const id = Number(params.id);
  if (id === me.id) return servePhoto(env, me, request);
  if (me.status !== "approved") throw new HttpError(403, "Forbidden");
  const row = await env.DB.prepare("SELECT * FROM interns WHERE id = ? AND batch_id = ? AND status = 'approved'")
    .bind(id, me.batch_id)
    .first();
  return servePhoto(env, row, request);
});

/* ---------------- Intern: daily reports ---------------- */

route("GET", "/api/interns/reports", async ({ request, env }) => {
  const me = await requireIntern(request, env);
  const rows = (
    await env.DB.prepare("SELECT * FROM reports WHERE intern_id = ? ORDER BY date").bind(me.id).all()
  ).results;
  return json({ ok: true, reports: rows.map(serializeReport) }, 200, request);
});

route("PUT", "/api/interns/reports/:date", async ({ request, env, params }) => {
  const me = await requireIntern(request, env);
  const date = params.date;
  const today = todayIST();
  if (!isISODate(date)) throw new HttpError(400, "Invalid date");
  if (!me.start_date) throw new HttpError(400, "Your start date has not been set yet");
  if (date < me.start_date) throw new HttpError(400, "This date is before your internship start date");
  if (me.end_date && date > me.end_date) throw new HttpError(400, "This date is after your internship end date");
  if (date > today) throw new HttpError(400, "You can't submit a report for a future date");
  if (date < addDays(today, -REPORT_GRACE_DAYS))
    throw new HttpError(400, `Reports can only be submitted within ${REPORT_GRACE_DAYS} days`);
  const r = cleanReport(await readJson(request));
  const now = nowISO();
  const row = await env.DB.prepare(
    `INSERT INTO reports (intern_id, date, activities, learnings, blockers, plan_next, hours, links, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(intern_id, date) DO UPDATE SET
       activities = excluded.activities, learnings = excluded.learnings, blockers = excluded.blockers,
       plan_next = excluded.plan_next, hours = excluded.hours, links = excluded.links, updated_at = excluded.updated_at
     RETURNING *`
  )
    .bind(me.id, date, r.activities, r.learnings, r.blockers, r.plan_next, r.hours, r.links, now, now)
    .first();
  return json({ ok: true, report: serializeReport(row) }, 200, request);
});

/* ---------------- Chat ---------------- */

route("GET", "/api/chat/ws", async ({ request, env, url }) => {
  const me = await requireIntern(request, env, { token: url.searchParams.get("token") });
  if (request.headers.get("Upgrade") !== "websocket") throw new HttpError(426, "Expected websocket");
  const h = hub(env);
  if (!h) throw new HttpError(500, "Chat not configured");
  return h.fetch(new Request(`https://hub/connect?uid=${me.id}`, request));
});

route("GET", "/api/chat/bootstrap", async ({ request, env }) => {
  const me = await requireIntern(request, env);
  // Every intern has a private line to the IVIS LABS team.
  await env.DB.batch(ensureAdminConvStmts(env, me.id, nowISO()));
  const [contacts, online] = await Promise.all([batchmates(env, me), onlineIds(env)]);
  const convs = (
    await env.DB.prepare(
      `SELECT c.id, c.type, c.name, c.batch_id, c.created_by, c.created_at, c.last_message_at,
              COALESCE(r.last_read_id, 0) AS last_read_id,
              (SELECT COUNT(*) FROM messages m
                 WHERE m.conversation_id = c.id AND m.id > COALESCE(r.last_read_id, 0) AND m.sender_id <> ?1) AS unread,
              (SELECT json_object('id', m.id, 'body', m.body, 'kind', m.kind, 'sender_id', m.sender_id, 'created_at', m.created_at)
                 FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
         FROM conversations c
         LEFT JOIN conv_reads r ON r.conversation_id = c.id AND r.intern_id = ?1
        WHERE (c.type = 'batch' AND c.batch_id = ?2)
           OR c.id IN (SELECT conversation_id FROM conv_members WHERE intern_id = ?1)
        ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`
    )
      .bind(me.id, me.batch_id)
      .all()
  ).results;
  const members = (
    await env.DB.prepare(
      `SELECT cm.conversation_id, i.id, i.full_name FROM conv_members cm JOIN interns i ON i.id = cm.intern_id
        WHERE cm.conversation_id IN (SELECT conversation_id FROM conv_members WHERE intern_id = ?)`
    )
      .bind(me.id)
      .all()
  ).results;
  const byConv = {};
  for (const m of members) (byConv[m.conversation_id] = byConv[m.conversation_id] || []).push({ id: m.id, full_name: m.full_name });
  const conversations = convs.map((c) => ({
    ...c,
    last_message: c.last_message ? JSON.parse(c.last_message) : null,
    members: c.type === "batch" ? null : byConv[c.id] || [],
  }));
  return json({ ok: true, me: { id: me.id, full_name: me.full_name }, contacts, online, conversations }, 200, request);
});

route("POST", "/api/chat/conversations", async ({ request, env, ctx }) => {
  const me = await requireIntern(request, env);
  const body = await readJson(request);
  const mates = new Set((await batchmates(env, me)).map((m) => m.id));
  if (body.type === "dm") {
    const other = Number(body.with);
    if (!mates.has(other)) throw new HttpError(400, "You can only message interns in your batch");
    const key = [me.id, other].sort((a, b) => a - b).join(":");
    await env.DB.prepare("INSERT OR IGNORE INTO conversations (type, dm_key, created_by, created_at) VALUES ('dm', ?, ?, ?)")
      .bind(key, me.id, nowISO())
      .run();
    const c = await env.DB.prepare("SELECT * FROM conversations WHERE dm_key = ?").bind(key).first();
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO conv_members (conversation_id, intern_id) VALUES (?, ?)").bind(c.id, me.id),
      env.DB.prepare("INSERT OR IGNORE INTO conv_members (conversation_id, intern_id) VALUES (?, ?)").bind(c.id, other),
    ]);
    return json({ ok: true, id: c.id }, 200, request);
  }
  if (body.type === "group") {
    const name = String(body.name || "").trim();
    if (!name || name.length > 60) throw new HttpError(400, "Group name is required (max 60 characters)");
    const ids = [...new Set((body.members || []).map(Number))].filter((id) => mates.has(id));
    if (!ids.length) throw new HttpError(400, "Pick at least one batchmate");
    const c = await env.DB.prepare(
      "INSERT INTO conversations (type, batch_id, name, created_by, created_at) VALUES ('group', ?, ?, ?, ?) RETURNING id"
    )
      .bind(me.batch_id, name, me.id, nowISO())
      .first();
    await env.DB.batch(
      [me.id, ...ids].map((id) =>
        env.DB.prepare("INSERT OR IGNORE INTO conv_members (conversation_id, intern_id) VALUES (?, ?)").bind(c.id, id)
      )
    );
    broadcast(env, ctx, ids, { type: "conversation", id: c.id });
    return json({ ok: true, id: c.id }, 201, request);
  }
  throw new HttpError(400, "Unknown conversation type");
});

route("GET", "/api/chat/conversations/:id/messages", async ({ request, env, params, url }) => {
  const me = await requireIntern(request, env);
  const c = await getConversation(env, me, Number(params.id));
  return json({ ok: true, ...(await pageMessages(env, c.id, url)) }, 200, request);
});

/** Messages of one conversation: newest 50, older (?before=id) or newer (?after=id). */
async function pageMessages(env, convId, url) {
  const after = Number(url.searchParams.get("after") || 0);
  const before = Number(url.searchParams.get("before") || 0);
  const base = `SELECT m.*, i.full_name AS sender_name FROM messages m LEFT JOIN interns i ON i.id = m.sender_id
                 WHERE m.conversation_id = ?`;
  let rows;
  if (after) {
    rows = (await env.DB.prepare(`${base} AND m.id > ? ORDER BY m.id LIMIT 200`).bind(convId, after).all()).results;
  } else {
    rows = (
      await env.DB.prepare(`${base} ${before ? "AND m.id < ?" : ""} ORDER BY m.id DESC LIMIT 50`)
        .bind(...(before ? [convId, before] : [convId]))
        .all()
    ).results.reverse();
  }
  return { messages: withSenderNames(rows), hasMore: !after && rows.length === 50 };
}

route("POST", "/api/chat/conversations/:id/messages", async ({ request, env, ctx, params }) => {
  const me = await requireIntern(request, env);
  const c = await getConversation(env, me, Number(params.id));
  const text = String((await readJson(request)).body || "").trim();
  if (!text) throw new HttpError(400, "Message is empty");
  if (text.length > 4000) throw new HttpError(400, "Message is too long (max 4000 characters)");
  return json({ ok: true, message: await postMessage(env, ctx, me, c, "text", text) }, 201, request);
});

route("POST", "/api/chat/conversations/:id/ping", async ({ request, env, ctx, params }) => {
  const me = await requireIntern(request, env);
  const c = await getConversation(env, me, Number(params.id));
  const last = await env.DB.prepare(
    "SELECT created_at FROM messages WHERE conversation_id = ? AND sender_id = ? AND kind = 'ping' ORDER BY id DESC LIMIT 1"
  )
    .bind(c.id, me.id)
    .first();
  if (last && Date.now() - new Date(last.created_at).getTime() < 30000)
    throw new HttpError(429, "You just pinged — wait a few seconds before pinging again");
  return json({ ok: true, message: await postMessage(env, ctx, me, c, "ping", "") }, 201, request);
});

route("POST", "/api/chat/conversations/:id/read", async ({ request, env, params }) => {
  const me = await requireIntern(request, env);
  const c = await getConversation(env, me, Number(params.id));
  const lastId = Number((await readJson(request)).lastId || 0);
  await env.DB.prepare(
    `INSERT INTO conv_reads (conversation_id, intern_id, last_read_id) VALUES (?, ?, ?)
     ON CONFLICT(conversation_id, intern_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)`
  )
    .bind(c.id, me.id, lastId)
    .run();
  return json({ ok: true }, 200, request);
});

route("POST", "/api/chat/conversations/:id/leave", async ({ request, env, params }) => {
  const me = await requireIntern(request, env);
  const c = await getConversation(env, me, Number(params.id));
  if (c.type !== "group") throw new HttpError(400, "You can only leave group chats");
  await env.DB.prepare("DELETE FROM conv_members WHERE conversation_id = ? AND intern_id = ?").bind(c.id, me.id).run();
  return json({ ok: true }, 200, request);
});

/* ---------------- Admin ---------------- */

route("POST", "/api/admin/login", async ({ request, env }) => {
  const { username, password } = await readJson(request);
  const r = await adminLogin(env, username, password);
  if (!r) throw new HttpError(401, "Invalid username or password");
  return json({ ok: true, ...r }, 200, request);
});

route("GET", "/api/admin/batches", async ({ request, env }) => {
  await requireAdmin(request, env);
  const rows = (
    await env.DB.prepare(
      `SELECT b.*, (SELECT COUNT(*) FROM interns i WHERE i.batch_id = b.id AND i.status = 'approved') AS intern_count
         FROM batches b ORDER BY b.created_at DESC`
    ).all()
  ).results;
  return json({ ok: true, batches: rows }, 200, request);
});

route("POST", "/api/admin/batches", async ({ request, env }) => {
  await requireAdmin(request, env);
  const name = String((await readJson(request)).name || "").trim();
  if (!name || name.length > 80) throw new HttpError(400, "Batch name is required");
  let b;
  try {
    b = await env.DB.prepare("INSERT INTO batches (name, created_at) VALUES (?, ?) RETURNING *").bind(name, nowISO()).first();
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) throw new HttpError(409, "A batch with this name already exists");
    throw e;
  }
  await ensureBatchChannel(env, b.id);
  return json({ ok: true, batch: b }, 201, request);
});

route("GET", "/api/admin/interns", async ({ request, env, url }) => {
  await requireAdmin(request, env);
  const status = url.searchParams.get("status");
  const where = status && STATUSES.includes(status) ? "WHERE i.status = ?" : "";
  const rows = (
    await env.DB.prepare(
      `SELECT i.*, b.name AS batch_name,
              (SELECT COUNT(*) FROM reports r WHERE r.intern_id = i.id) AS report_count,
              (SELECT MAX(date) FROM reports r WHERE r.intern_id = i.id) AS last_report_date
         FROM interns i LEFT JOIN batches b ON b.id = i.batch_id ${where}
        ORDER BY CASE i.status WHEN 'pending' THEN 0 ELSE 1 END, i.created_at DESC`
    )
      .bind(...(where ? [status] : []))
      .all()
  ).results;
  return json({ ok: true, interns: rows.map(publicIntern), today: todayIST() }, 200, request);
});

async function adminIntern(env, id) {
  const row = await env.DB.prepare(
    "SELECT i.*, b.name AS batch_name FROM interns i LEFT JOIN batches b ON b.id = i.batch_id WHERE i.id = ?"
  )
    .bind(id)
    .first();
  if (!row) throw new HttpError(404, "Intern not found");
  return row;
}

route("GET", "/api/admin/interns/:id", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  return json({ ok: true, intern: publicIntern(await adminIntern(env, Number(params.id))) }, 200, request);
});

route("POST", "/api/admin/interns/:id/approve", async ({ request, env, params }) => {
  const admin = await requireAdmin(request, env);
  const row = await adminIntern(env, Number(params.id));
  const body = await readJson(request);
  const batchId = Number(body.batch_id);
  if (!batchId) throw new HttpError(400, "Choose a batch for this intern");
  await ensureBatchChannel(env, batchId);
  const { start, end } = scheduleFrom({ start_date: body.start_date, end_date: body.end_date }, row);
  const code = row.intern_code || (await nextInternCode(env, start.slice(0, 4)));
  await env.DB.prepare(
    `UPDATE interns SET status = 'approved', batch_id = ?, start_date = ?, end_date = ?, intern_code = ?,
            verify_token = COALESCE(verify_token, ?), approved_at = COALESCE(approved_at, ?), approved_by = ?,
            admin_note = ?, updated_at = ? WHERE id = ?`
  )
    .bind(batchId, start, end, code, randomToken(), nowISO(), admin, body.admin_note || null, nowISO(), row.id)
    .run();
  return json({ ok: true, intern: publicIntern(await adminIntern(env, row.id)) }, 200, request);
});

route("PATCH", "/api/admin/interns/:id", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  const row = await adminIntern(env, Number(params.id));
  const body = await readJson(request);
  const set = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw new HttpError(400, "Invalid status");
    if (body.status === "approved" && !row.intern_code) throw new HttpError(400, "Use Approve for a new intern");
    set.status = body.status;
  }
  if (body.batch_id !== undefined) {
    const b = Number(body.batch_id);
    if (!b) throw new HttpError(400, "Invalid batch");
    await ensureBatchChannel(env, b);
    set.batch_id = b;
  }
  if (body.start_date !== undefined || body.end_date !== undefined) {
    const { start, end } = scheduleFrom(body, row);
    set.start_date = start;
    set.end_date = end;
  }
  if (body.duration !== undefined) {
    if (!DURATIONS[body.duration]) throw new HttpError(400, "Invalid duration");
    set.duration = body.duration;
  }
  if (body.admin_note !== undefined) set.admin_note = String(body.admin_note || "").slice(0, 1000) || null;
  const cols = Object.keys(set);
  if (cols.length) {
    await env.DB.prepare(`UPDATE interns SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
      .bind(...cols.map((c) => set[c]), nowISO(), row.id)
      .run();
  }
  return json({ ok: true, intern: publicIntern(await adminIntern(env, row.id)) }, 200, request);
});

route("POST", "/api/admin/interns/:id/reset-password", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  const row = await adminIntern(env, Number(params.id));
  const temp = randomToken(6).replace(/[-_]/g, "x");
  const { hash, salt } = await hashPassword(temp);
  await env.DB.prepare("UPDATE interns SET pw_hash = ?, pw_salt = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?")
    .bind(hash, salt, nowISO(), row.id)
    .run();
  return json({ ok: true, password: temp }, 200, request);
});

route("GET", "/api/admin/interns/:id/reports", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  const rows = (
    await env.DB.prepare("SELECT * FROM reports WHERE intern_id = ? ORDER BY date").bind(Number(params.id)).all()
  ).results;
  return json({ ok: true, reports: rows.map(serializeReport) }, 200, request);
});

route("GET", "/api/admin/interns/:id/photo", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  return servePhoto(env, await adminIntern(env, Number(params.id)), request);
});

route("PUT", "/api/admin/reports/:id/comment", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  const comment = String((await readJson(request)).comment || "").trim().slice(0, 2000) || null;
  const row = await env.DB.prepare("UPDATE reports SET admin_comment = ? WHERE id = ? RETURNING *")
    .bind(comment, Number(params.id))
    .first();
  if (!row) throw new HttpError(404, "Report not found");
  return json({ ok: true, report: serializeReport(row) }, 200, request);
});

/* ---------------- Admin: everyone's daily reports ---------------- */

const REPORT_COLS = `r.*, i.full_name, i.intern_code, i.batch_id, b.name AS batch_name,
                     i.photo_key IS NOT NULL AS has_photo, i.photo_updated_at`;

// ?date=YYYY-MM-DD[&batch_id=] → that day's reports + approved interns who haven't filed.
// ?from=&to=[&batch_id=]       → every report in the range (max 1 year), for export.
route("GET", "/api/admin/reports", async ({ request, env, url }) => {
  await requireAdmin(request, env);
  const batchId = Number(url.searchParams.get("batch_id") || 0);
  const bWhere = batchId ? "AND i.batch_id = ?" : "";
  const bArgs = batchId ? [batchId] : [];
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from || to) {
    if (!isISODate(from) || !isISODate(to) || to < from) throw new HttpError(400, "Invalid date range");
    if (to > addDays(from, 366)) throw new HttpError(400, "Range can be at most one year");
    const rows = (
      await env.DB.prepare(
        `SELECT ${REPORT_COLS} FROM reports r JOIN interns i ON i.id = r.intern_id LEFT JOIN batches b ON b.id = i.batch_id
          WHERE r.date BETWEEN ? AND ? ${bWhere} ORDER BY r.date, i.full_name`
      )
        .bind(from, to, ...bArgs)
        .all()
    ).results;
    return json({ ok: true, reports: rows.map(serializeReport) }, 200, request);
  }
  const date = url.searchParams.get("date") || todayIST();
  if (!isISODate(date)) throw new HttpError(400, "Invalid date");
  const [reports, missing] = await Promise.all([
    env.DB.prepare(
      `SELECT ${REPORT_COLS} FROM reports r JOIN interns i ON i.id = r.intern_id LEFT JOIN batches b ON b.id = i.batch_id
        WHERE r.date = ? ${bWhere} ORDER BY i.full_name`
    )
      .bind(date, ...bArgs)
      .all(),
    env.DB.prepare(
      `SELECT i.id, i.full_name, i.intern_code, i.batch_id, b.name AS batch_name,
              i.photo_key IS NOT NULL AS has_photo, i.photo_updated_at
         FROM interns i LEFT JOIN batches b ON b.id = i.batch_id
        WHERE i.status = 'approved' AND i.start_date <= ?1 AND (i.end_date IS NULL OR i.end_date >= ?1) ${bWhere.replace("?", "?2")}
          AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.intern_id = i.id AND r.date = ?1)
        ORDER BY i.full_name`
    )
      .bind(date, ...bArgs)
      .all(),
  ]);
  return json(
    { ok: true, date, today: todayIST(), reports: reports.results.map(serializeReport), missing: missing.results },
    200,
    request
  );
});

/* ---------------- Admin: messages to interns ---------------- */

route("GET", "/api/admin/chat/inbox", async ({ request, env }) => {
  await requireAdmin(request, env);
  const rows = (
    await env.DB.prepare(
      `SELECT c.id, c.last_message_at, i.id AS intern_id, i.full_name, i.intern_code, i.status,
              b.name AS batch_name, i.photo_key IS NOT NULL AS has_photo, i.photo_updated_at,
              (SELECT COUNT(*) FROM messages m
                 WHERE m.conversation_id = c.id AND m.id > COALESCE(r.last_read_id, 0) AND m.sender_id <> 0) AS unread,
              (SELECT json_object('id', m.id, 'body', m.body, 'kind', m.kind, 'sender_id', m.sender_id,
                                  'sender_admin', m.sender_admin, 'created_at', m.created_at)
                 FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
         FROM conversations c
         JOIN conv_members cm ON cm.conversation_id = c.id
         JOIN interns i ON i.id = cm.intern_id
         LEFT JOIN batches b ON b.id = i.batch_id
         LEFT JOIN conv_reads r ON r.conversation_id = c.id AND r.intern_id = 0
        WHERE c.type = 'admin' AND c.last_message_at IS NOT NULL
        ORDER BY c.last_message_at DESC`
    ).all()
  ).results;
  // Threads waiting for a reply first (a broadcast would otherwise bury them).
  const threads = rows
    .map((r) => ({ ...r, last_message: r.last_message ? JSON.parse(r.last_message) : null }))
    .sort((x, y) => (y.unread > 0) - (x.unread > 0));
  return json({ ok: true, threads, unread: threads.reduce((n, t) => n + t.unread, 0) }, 200, request);
});

async function adminConvFor(env, internId) {
  return env.DB.prepare("SELECT * FROM conversations WHERE dm_key = ?").bind(adminConvKey(internId)).first();
}

route("GET", "/api/admin/chat/:internId/messages", async ({ request, env, params, url }) => {
  await requireAdmin(request, env);
  const c = await adminConvFor(env, Number(params.internId));
  if (!c) return json({ ok: true, messages: [], hasMore: false }, 200, request);
  return json({ ok: true, ...(await pageMessages(env, c.id, url)) }, 200, request);
});

route("POST", "/api/admin/chat/:internId/read", async ({ request, env, params }) => {
  await requireAdmin(request, env);
  const c = await adminConvFor(env, Number(params.internId));
  const lastId = Number((await readJson(request)).lastId || 0);
  if (c && lastId) {
    await env.DB.prepare(
      `INSERT INTO conv_reads (conversation_id, intern_id, last_read_id) VALUES (?, 0, ?)
       ON CONFLICT(conversation_id, intern_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)`
    )
      .bind(c.id, lastId)
      .run();
  }
  return json({ ok: true }, 200, request);
});

// { to: "all" | "batch" | "selected", batch_id?, ids?, body, kind?: "text" | "ping" }
// Each recipient gets the message in their private chat with the IVIS LABS team.
route("POST", "/api/admin/chat/send", async ({ request, env, ctx }) => {
  const admin = await requireAdmin(request, env);
  const b = await readJson(request);
  const kind = b.kind === "ping" ? "ping" : "text";
  const text = String(b.body || "").trim();
  if (kind === "text" && !text) throw new HttpError(400, "Message is empty");
  if (text.length > 4000) throw new HttpError(400, "Message is too long (max 4000 characters)");
  let q;
  if (b.to === "all") {
    q = env.DB.prepare("SELECT id FROM interns WHERE status = 'approved'");
  } else if (b.to === "batch") {
    const batchId = Number(b.batch_id);
    if (!batchId) throw new HttpError(400, "Choose a batch");
    q = env.DB.prepare("SELECT id FROM interns WHERE status = 'approved' AND batch_id = ?").bind(batchId);
  } else if (b.to === "selected") {
    const ids = [...new Set((Array.isArray(b.ids) ? b.ids : []).map(Number).filter((n) => n > 0))];
    if (!ids.length) throw new HttpError(400, "Pick at least one intern");
    q = env.DB.prepare(
      "SELECT id FROM interns WHERE status = 'approved' AND id IN (SELECT value FROM json_each(?))"
    ).bind(JSON.stringify(ids));
  } else {
    throw new HttpError(400, "Choose who to send to");
  }
  const targets = (await q.all()).results.map((r) => r.id);
  if (!targets.length) throw new HttpError(400, "No active interns match these recipients");
  if (targets.length > 1000) throw new HttpError(400, "Too many recipients at once");
  const messages = await adminSend(env, ctx, admin, targets, kind, kind === "ping" ? "" : text);
  return json({ ok: true, sent: messages.length, messages }, 201, request);
});

/* ------------------------------------------------------------------ */
/* Public ID-card verification page                                    */
/* ------------------------------------------------------------------ */
function internVerifyPage(r, origin, token) {
  if (!r || !["approved", "suspended"].includes(r.status)) {
    return htmlResponse(
      pageShell(
        "Not verified",
        `<div class="bar bad">✕ Not verified</div><div class="body"><h1>No matching intern ID</h1>
         <div class="muted">This ID card is not registered with IVIS LABS. It may be forged or the code was mistyped.</div></div>`
      ),
      404
    );
  }
  const today = todayIST();
  let state = "Active intern";
  let cls = "ok";
  if (r.status === "suspended") [state, cls] = ["✕ Revoked — this ID card is no longer valid", "bad"];
  else if (r.end_date && today > r.end_date) [state, cls] = ["Internship completed — ID card expired", "warn"];
  else if (r.start_date && today < r.start_date) state = "Internship starts on " + r.start_date;
  const spec = r.specialization === "Others" ? r.specialization_other : r.specialization;
  const rows = [
    ["Name", r.full_name],
    ["Intern ID", r.intern_code],
    ["Programme", `${r.degree}${spec ? " · " + spec : ""}`],
    ["College", r.college],
    ["Batch", r.batch_name],
    ["Valid", r.start_date && r.end_date ? `${r.start_date} to ${r.end_date}` : ""],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join("");
  const photo = r.photo_key
    ? `<img src="${origin}/intern-id/${encodeURIComponent(token)}/photo" alt="" style="width:110px;height:140px;object-fit:cover;border-radius:10px;float:right;margin:0 0 12px 16px;border:1px solid #e2e8f0">`
    : "";
  return htmlResponse(
    pageShell(
      "Intern ID",
      `<style>.warn{background:#d97706}</style>
       <div class="bar ${cls}">${cls === "ok" ? "✔ " : ""}${esc(state)}</div>
       <div class="body">${photo}<h1>${esc(r.full_name)}</h1>
         <div class="muted">Intern at IVIS LABS Private Limited. The details below are the official record.</div>
         <table style="clear:both">${rows}</table></div>`
    )
  );
}
