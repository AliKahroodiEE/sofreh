# Sofreh API

NestJS 12 + TypeScript REST API for the Sofreh food-delivery platform, with PostgreSQL (Prisma), Redis,
Socket.IO and Swagger.

- Swagger UI: `http://localhost:4100/api/docs` · reference with examples: [`../../docs/API.md`](../../docs/API.md)
- Architecture and module map: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- Database and Redis keys: [`../../docs/DATABASE.md`](../../docs/DATABASE.md)

## Run locally

```bash
docker compose up -d postgres redis      # from the repository root
cp .env.example .env                     # set JWT_ACCESS_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev                        # http://localhost:4100/api/v1
```

## Scripts

| Script | Description |
|---|---|
| `start:dev` | watch mode |
| `build` / `start:prod` | compile to `dist/` and run it |
| `test` | unit tests (pricing, discounts, order status, phone parsing) |
| `test:e2e` | end-to-end tests against PostgreSQL + Redis |
| `lint` | Oxlint, type-aware |
| `db:migrate` / `db:deploy` | create / apply Prisma migrations |
| `db:seed` / `db:reset` | load demo data / recreate the database with demo data |

## Docker

`Dockerfile` builds a production image; on start, `docker-entrypoint.sh` applies migrations
(`prisma migrate deploy`), optionally seeds demo data (`SEED_DEMO_DATA=true`) and starts the server.
See [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md).
