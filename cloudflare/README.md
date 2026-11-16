# IVIS LABS – Documents, verification & intern portal

A private `/admin` console issues three document types and registers each one in
Cloudflare R2 so it can be verified via a QR code:

- Internship Offer Letter
- Internship Completion Certificate
- Performance Award Certificate

## How it works

```
Admin (/admin, React)                     Cloudflare Worker + R2
─────────────────────                     ──────────────────────
1. login (/api/admin/login)
2. fill form, generate PDF   ──POST──►    /api/issue   (needs admin password)
   (jsPDF + QR + seal.png)                 └─ stores documents/<id>.pdf
                                              stores records/<id>.json
3. QR in PDF points to      ◄─public──     /verify/<id>  (HTML "genuine" page)
                                            /document/<id>.pdf (original PDF)
```

**Anti-forgery:** the QR resolves to `…/verify/<id>`, which shows the *official
record* (recipient, role, dates) stored in R2. A copied/edited certificate that
reuses a real QR still displays the **original** recipient's details, so a forged
copy in someone else's name is immediately exposed. An unregistered ID shows a
red "Not verified" page.

## Cloudflare resources (already provisioned)

| Resource | Value |
| --- | --- |
| Account ID | `f46875ef0aadedeaa0c08ffe56e18f5c` |
| Worker | `ivislabs-certificates` |
| Worker URL | `https://ivislabs-certificates.vinay-f46.workers.dev` |
| R2 bucket | `ivislabs-certificates` |
| D1 database | `ivislabs-interns` (created by `deploy.sh`) |
| Bindings | `CERTS` (R2), `DB` (D1), `CHAT` (Durable Object `ChatHub`), `ADMIN_USERS`, `SESSION_SECRET` (secrets) |

The React app reaches the Worker via `REACT_APP_CERT_API` in `.env`.

## Redeploying the Worker

```bash
cp cloudflare/secrets.example.env cloudflare/.secrets.env   # first time; set admin users
export CLOUDFLARE_API_TOKEN=<token with Workers Scripts + R2 + D1 edit>
./cloudflare/deploy.sh
```

Code: `worker.js` (router + documents), `interns.js` (intern portal API),
`chatHub.js` (real-time chat Durable Object), `lib.js` (auth, CORS, dates).

## Admin users

Admin logins are checked **by the Worker**, not in the browser. They live in
`ADMIN_USERS` in `cloudflare/.secrets.env` (gitignored):

```bash
ADMIN_USERS='[{"username":"admin","password":"..."},{"username":"vinay","password":"..."}]'
```

Add/remove a user → edit that line → `./cloudflare/deploy.sh`. Removing a user
also ends their open sessions. Sessions are signed tokens (12 h for admins)
using `SESSION_SECRET`; changing that secret signs everyone out.

## Intern portal (`/interns`)

1. **Register** – candidates fill personal, academic (college, degree, specialization),
   internship (duration, preferred start), address and emergency-contact details and
   choose a password. Status: *pending*.
2. **Approve** – `/admin` → **Interns** → open the candidate → choose a **batch**,
   **start date** (end date auto-fills from the duration, editable) → Approve. The
   intern gets an ID like `IVIS-INT-2026-0001`. Batch, dates and duration can be
   changed any time; interns can be suspended (ID card then shows *revoked*) or
   have their password reset (a temporary password is shown to the admin).
3. **Calendar & daily reports** – approved interns see their internship calendar and
   submit a daily report (activities, learnings, blockers, plan, hours, links) for
   today or the previous 2 days (`REPORT_GRACE_DAYS` in `interns.js`). Sundays are
   optional. Admins see the same calendar per intern and can leave feedback.
4. **Chat** – each batch has a group channel; interns can also DM or create groups,
   **only with interns in their own batch**. Messages are stored in D1 and pushed
   live over WebSockets (`ChatHub`), with unread badges, online status, sound and
   desktop notifications. **Ping** buzzes the other person (banner + sound +
   vibration); limited to once per 30 s per chat.
5. **Photo & ID card** – approved interns upload a photo (cropped to 3:4, stored in R2
   under `interns/photos/`) and download a CR80 ID card (PDF or PNG). The QR code
   opens `…/intern-id/<random token>`, a public page confirming the intern and
   whether the card is active, expired or revoked.

Admin tabs under `/admin` → **Interns**:

- **Interns** – registrations, approval, schedule, account actions, per-intern calendar.
- **Daily reports** – everyone's report for a chosen day (filter by batch), who hasn't
  reported yet with a one-click reminder, inline comments, CSV export for a date range.
- **ID cards** – card previews for all approved interns; open one to see both sides and
  download PDF/PNG, or download an A4 print sheet (9 per page, backs mirrored for
  double-sided printing). Interns without a photo are listed with a reminder button.
- **Messages** – every intern has a private **IVIS LABS Team** chat. Admins can reply
  there, or send one message (or ping) to selected interns, a whole batch, or everyone;
  each copy lands in the recipient's own private chat and arrives live. Admin messages
  are stored with `sender_id = 0` and the admin's username in `sender_admin`.

Data: D1 tables `interns`, `batches`, `reports`, `conversations`, `conv_members`,
`conv_reads`, `messages` (created automatically by the Worker).

Local development (Node 18+):

```bash
npx wrangler@4 dev -c cloudflare/wrangler.dev.toml --local     # API on :8787
REACT_APP_CERT_API=http://localhost:8787 PORT=3001 npm start    # admin/admin
```

## Bulk issue from Excel

The admin console has a **Bulk issue from Excel** panel:

1. Pick the document type, click **Download template** to get a pre-filled
   `.xlsx` (headers + one example row).
2. Fill one row per recipient (dates as `YYYY-MM-DD`; Excel date cells also work).
3. Upload the file — rows are validated and previewed.
4. **Generate & Issue** — every row is generated, registered in R2 with its own
   QR code, and all PDFs are bundled into a single ZIP (plus `manifest.csv`
   listing each recipient, verification ID, and verify URL) that downloads
   automatically.

Add an optional `type` column (`offer` / `completion` / `performance`) to mix
document types in one sheet. Failed rows are listed and don't block the rest.

## The seal + signature

Place your combined seal+signature image at `public/seal.png`
(see `public/SEAL_README.md`). It is embedded into every generated PDF.

## Security notes

- No passwords are bundled into the site any more; the old shared `X-Admin-Key`
  is no longer accepted once the Worker is redeployed without `ADMIN_PASS`.
- The previous admin passwords were public (they were in the site's JavaScript and
  in git history) — use new ones in `.secrets.env`.
- Intern passwords are stored as PBKDF2-SHA256 hashes; photos and reports are only
  served to the intern, their batchmates (photo only) and admins.
