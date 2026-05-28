#!/bin/bash
set -e

# Deploy the web app from monorepo root by temporarily swapping .vercel/project.json
# to point at the web project (which has rootDirectory: apps/web set on Vercel).
# This avoids the path-doubling bug that occurs when deploying from apps/web/.

TARGET=${1:-preview}

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERCEL_JSON="$ROOT_DIR/.vercel/project.json"
BACKUP_JSON="$ROOT_DIR/.vercel/project.api.json"

WEB_PROJECT_JSON='{
  "projectId": "prj_phT1Z7i6xlR9kCrUMvOOcF1EVL58",
  "orgId": "team_tQmzULbSEWi2bOgC55O4wPdr",
  "projectName": "dawolink-web",
  "settings": {
    "createdAt": 1779915499432,
    "framework": "nextjs",
    "devCommand": null,
    "installCommand": "cd ../.. && npm install --include=dev",
    "buildCommand": null,
    "outputDirectory": null,
    "rootDirectory": "apps/web",
    "directoryListing": false,
    "nodeVersion": "24.x"
  }
}'

cleanup() {
  echo "Restoring API project.json..."
  cp "$BACKUP_JSON" "$VERCEL_JSON"
  rm -f "$BACKUP_JSON"
}

# Backup current (API) project.json and restore it on exit
cp "$VERCEL_JSON" "$BACKUP_JSON"
trap cleanup EXIT

echo "Switching .vercel/project.json to web project..."
echo "$WEB_PROJECT_JSON" > "$VERCEL_JSON"

cd "$ROOT_DIR"

if [ "$TARGET" = "prod" ] || [ "$TARGET" = "production" ]; then
  echo "Deploying web to production..."
  vercel deploy --prod
else
  echo "Deploying web to preview..."
  vercel deploy
fi
