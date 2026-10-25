#!/bin/sh
# Apply pending database migrations, optionally load demo data, then start the API.
set -e

npx prisma migrate deploy

if [ "$SEED_DEMO_DATA" = "true" ]; then
  echo "SEED_DEMO_DATA=true: loading demo data (this wipes existing data)"
  node prisma/seed.ts
fi

exec node dist/main.js
