#!/usr/bin/env bash
# Redeploy the IVIS LABS certificate-verification Worker.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN=xxxxx      # token with Workers + R2 edit access
#   ./cloudflare/deploy.sh
#
# This deploys via the Cloudflare REST API (no wrangler / Node 20 required).
set -euo pipefail

ACCOUNT_ID="f46875ef0aadedeaa0c08ffe56e18f5c"
SCRIPT_NAME="ivislabs-certificates"
BUCKET="ivislabs-certificates"
ADMIN_USER="admin"
ADMIN_PASS="iVis2021"          # keep in sync with src/config/adminAuth.json
COMPAT_DATE="2024-11-06"

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN in your environment first}"

HERE="$(cd "$(dirname "$0")" && pwd)"

META=$(cat <<JSON
{"main_module":"worker.js","compatibility_date":"$COMPAT_DATE","bindings":[
  {"type":"r2_bucket","name":"CERTS","bucket_name":"$BUCKET"},
  {"type":"secret_text","name":"ADMIN_USER","text":"$ADMIN_USER"},
  {"type":"secret_text","name":"ADMIN_PASS","text":"$ADMIN_PASS"}
]}
JSON
)

echo "Deploying $SCRIPT_NAME ..."
curl -sf -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$SCRIPT_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -F "metadata=$META;type=application/json" \
  -F "worker.js=@$HERE/worker.js;type=application/javascript+module" \
  >/dev/null && echo "Deployed."

# Ensure the workers.dev route is enabled.
curl -sf -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$SCRIPT_NAME/subdomain" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" --data '{"enabled":true}' >/dev/null

echo "Live at: https://$SCRIPT_NAME.vinay-f46.workers.dev"
