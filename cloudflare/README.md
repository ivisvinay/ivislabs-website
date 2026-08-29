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

## Changing the admin password

The password lives in **two** places — keep them identical:

1. `src/config/adminAuth.json` (client login gate) — then rebuild/redeploy the site.
2. `ADMIN_PASS` in `cloudflare/deploy.sh` — then run `./cloudflare/deploy.sh`.

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
