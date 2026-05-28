#!/bin/bash
set -e

TARGET=${1:-preview}

echo "Building for $TARGET..."

FUNC_TS=".vercel/output/functions/api/index.ts.func"
FUNC_OUT=".vercel/output/functions/api/index.func"

if [ "$TARGET" = "prod" ] || [ "$TARGET" = "production" ]; then
  vercel build --prod --local-config vercel-api.json
  rm -rf "$FUNC_OUT"
  cp -r "$FUNC_TS" "$FUNC_OUT"
  vercel deploy --prod --prebuilt --local-config vercel-api.json
else
  vercel build --local-config vercel-api.json
  rm -rf "$FUNC_OUT"
  cp -r "$FUNC_TS" "$FUNC_OUT"
  vercel deploy --prebuilt --local-config vercel-api.json
fi
