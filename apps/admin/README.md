# Sofreh admin panel (پنل مدیریت سفره)

Next.js 16 (App Router, TypeScript, Tailwind v4) admin for the Sofreh food-delivery demo.
Persian RTL UI, live orders over Socket.IO, TanStack Query for data, Recharts for charts.

## Run locally

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4100
npm install
npm run dev                  # http://localhost:3100
```

The API (apps/api) must be running. Demo admin: `09120000000`; in dev mode the one-time code
is shown on the login screen.

Scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm start` (port 3100).

## Docker

`Dockerfile` builds the standalone output (node:24-alpine, port 3100). Pass the API origin the
browser should use: `--build-arg NEXT_PUBLIC_API_URL=http://localhost:8080` (Nginx serves the
admin at `/` and the API at `/api`, `/uploads`, `/socket.io`).

## Structure

- `app/` routes: `login/`, `(panel)/` (dashboard, orders, restaurants, menu, discounts, users)
- `components/` UI kit (`ui/`), layout (sidebar, top bar, auth guard) and one folder per feature
- `lib/api/` typed API client (token refresh, Persian errors), endpoints and types
- `lib/auth/session.ts` session store (localStorage + `useSyncExternalStore`)
- `lib/realtime.tsx` Socket.IO → TanStack Query cache updates and toasts
- `lib/format.ts`, `lib/jalali.ts` Persian digits, toman, Jalali dates
