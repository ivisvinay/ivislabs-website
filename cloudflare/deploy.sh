#!/usr/bin/env bash
# Redeploy the IVIS LABS Worker (document verification + intern portal).
#
# Usage:
#   export CLOUDFLARE_API_TOKEN=xxxxx   # token with Workers Scripts + R2 + D1 edit
#   cp cloudflare/secrets.example.env cloudflare/.secrets.env   # first time only, then edit
#   ./cloudflare/deploy.sh
#
# Deploys via the Cloudflare REST API (no wrangler needed; needs curl + node).
# Creates the D1 database on first run and applies the ChatHub Durable Object
# migration once. The D1 tables are created by the Worker itself on first use.
set -euo pipefail

ACCOUNT_ID="f46875ef0aadedeaa0c08ffe56e18f5c"
SCRIPT_NAME="ivislabs-certificates"
BUCKET="ivislabs-certificates"
D1_NAME="ivislabs-interns"
COMPAT_DATE="2024-11-06"
DO_MIGRATION_TAG="v1"

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN in your environment first}"

HERE="$(cd "$(dirname "$0")" && pwd)"
SECRETS="$HERE/.secrets.env"
API="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID"
AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

# ---- Secrets (kept out of git) ----
if [[ ! -f "$SECRETS" ]]; then
  echo "Missing $SECRETS — copy secrets.example.env to .secrets.env and fill it in." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$SECRETS"
: "${ADMIN_USERS:?ADMIN_USERS must be set in .secrets.env}"
if [[ -z "${SESSION_SECRET:-}" ]]; then
  SESSION_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
  printf '\nSESSION_SECRET=%s\n' "$SESSION_SECRET" >> "$SECRETS"
  echo "Generated SESSION_SECRET and saved it to .secrets.env"
fi

jget() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(($1)??'')})"; }

# ---- D1 database (find or create) ----
D1_ID=$(curl -sS --fail-with-body "${AUTH[@]}" "$API/d1/database?name=$D1_NAME" | jget "j.result.find(x=>x.name==='$D1_NAME')?.uuid")
if [[ -z "$D1_ID" ]]; then
  echo "Creating D1 database $D1_NAME ..."
  D1_ID=$(curl -sS --fail-with-body "${AUTH[@]}" -H "Content-Type: application/json" -X POST "$API/d1/database" \
    --data "{\"name\":\"$D1_NAME\"}" | jget "j.result.uuid")
fi
echo "D1: $D1_NAME ($D1_ID)"

# ---- Durable Object migration (only if not applied yet) ----
CUR_TAG=$(curl -sS --fail-with-body "${AUTH[@]}" "$API/workers/scripts" | jget "j.result.find(s=>s.id==='$SCRIPT_NAME')?.migration_tag")
MIGRATIONS=""
if [[ "$CUR_TAG" != "$DO_MIGRATION_TAG" ]]; then
  MIGRATIONS=",\"migrations\":{\"new_tag\":\"$DO_MIGRATION_TAG\",\"new_sqlite_classes\":[\"ChatHub\"]}"
  echo "Applying Durable Object migration $DO_MIGRATION_TAG"
fi

META=$(ADMIN_USERS="$ADMIN_USERS" SESSION_SECRET="$SESSION_SECRET" node -e '
const m = {
  main_module: "worker.js",
  compatibility_date: process.argv[1],
  bindings: [
    { type: "r2_bucket", name: "CERTS", bucket_name: process.argv[2] },
    { type: "d1", name: "DB", id: process.argv[3] },
    { type: "durable_object_namespace", name: "CHAT", class_name: "ChatHub" },
    { type: "secret_text", name: "ADMIN_USERS", text: process.env.ADMIN_USERS },
    { type: "secret_text", name: "SESSION_SECRET", text: process.env.SESSION_SECRET },
  ],
};
JSON.parse(process.env.ADMIN_USERS); // fail early on bad JSON
let s = JSON.stringify(m);
console.log(s.slice(0, -1) + process.argv[4] + "}");
' "$COMPAT_DATE" "$BUCKET" "$D1_ID" "$MIGRATIONS")

OUT="$(mktemp)"; trap 'rm -f "$OUT"' EXIT
echo "Deploying $SCRIPT_NAME ..."
curl -sS --fail-with-body -X PUT "$API/workers/scripts/$SCRIPT_NAME" "${AUTH[@]}" \
  -F "metadata=$META;type=application/json" \
  -F "worker.js=@$HERE/worker.js;type=application/javascript+module" \
  -F "lib.js=@$HERE/lib.js;type=application/javascript+module" \
  -F "interns.js=@$HERE/interns.js;type=application/javascript+module" \
  -F "chatHub.js=@$HERE/chatHub.js;type=application/javascript+module" \
  -o "$OUT" || { cat "$OUT" >&2; exit 1; }
echo "Deployed."

# Ensure the workers.dev route is enabled.
curl -sS --fail-with-body -X POST "$API/workers/scripts/$SCRIPT_NAME/subdomain" "${AUTH[@]}" \
  -H "Content-Type: application/json" --data '{"enabled":true}' >/dev/null

echo "Live at: https://$SCRIPT_NAME.vinay-f46.workers.dev"
