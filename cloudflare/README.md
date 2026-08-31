# IVIS LABS – Document issuing & verification

A private `/admin` console issues three document types and registers each one in
Cloudflare R2 so it can be verified via a QR code:

- Internship Offer Letter
- Internship Completion Certificate
- Performance Award Certificate

## How it works

```
Admin (/admin, React)                     Cloudflare Worker + R2
─────────────────────                     ──────────────────────
1. login (adminAuth.json)
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
| Bindings | `CERTS` (R2), `ADMIN_USER`, `ADMIN_PASS` (secrets) |

The React app reaches the Worker via `REACT_APP_CERT_API` in `.env`.

## Redeploying the Worker

```bash
export CLOUDFLARE_API_TOKEN=<token with Workers + R2 edit>
./cloudflare/deploy.sh
```

## Admin users

`src/config/adminAuth.json` holds the login gate and the shared Worker key:

```json
{
  "apiKey": "iVis2021",
  "users": [
    { "username": "admin",  "password": "iVis2021" },
    { "username": "vinay",  "password": "another-pass" }
  ]
}
```

- **Add / remove a user:** edit the `users` array and redeploy the **site**
  (push to `ivislabs`). No Worker change is needed — every user shares `apiKey`
  to talk to the Worker, and the document record stores which username issued it.
- **`apiKey`** must equal the Worker's `ADMIN_PASS` secret (`iVis2021`). Change it
  in both `adminAuth.json` and `cloudflare/deploy.sh`, then run
  `./cloudflare/deploy.sh` and redeploy the site.
- (Optional) For per-user Worker keys instead of one shared key, set an
  `ADMIN_KEYS` secret (comma-separated) on the Worker; it accepts any of them.

Note: because `adminAuth.json` is bundled into the public site, these passwords
are technically visible in the site's JavaScript — see the security note below.

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

## Security note (please read)

By design (per request) the admin credentials live in `src/config/adminAuth.json`,
which is bundled into the public site — so the password is technically
extractable from the site's JavaScript, and the Worker uses that same password to
authorise issuing. This is fine against the intended threat (students copying a
real certificate — the QR record defeats that). If you later want to harden it so
the password is **not** shipped to browsers, the change is small: remove the
password from `adminAuth.json`, add a `/api/login` check in the Worker, and have
the login form validate against the Worker instead. Ask and it can be wired up.
