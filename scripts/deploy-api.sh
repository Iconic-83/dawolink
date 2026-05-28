#!/bin/bash
set -e

TARGET=${1:-preview}

echo "Building for $TARGET..."
if [ "$TARGET" = "prod" ] || [ "$TARGET" = "production" ]; then
  vercel build --prod --local-config vercel-api.json
  cp -r .vercel/output/functions/api/index.ts.func .vercel/output/functions/api/index.func
  vercel deploy --prod --prebuilt --local-config vercel-api.json
else
  vercel build --local-config vercel-api.json
  cp -r .vercel/output/functions/api/index.ts.func .vercel/output/functions/api/index.func
  vercel deploy --prebuilt --local-config vercel-api.json
fi
