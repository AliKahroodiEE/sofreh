# Deployment

The whole stack (PostgreSQL, Redis, API, admin panel, Nginx) runs with Docker Compose on any Linux server,
including Iranian cloud providers (ArvanCloud, Liara, Hamravesh, ParsPack). Nothing depends on services that are
blocked in Iran: fonts are self-hosted and no Google APIs are used.

## 1. Server

Ubuntu 22.04+ with Docker Engine and the Compose plugin. 2 vCPU / 4 GB RAM is enough to start.

> **Docker Hub access from Iran:** if image pulls fail, configure a registry mirror in `/etc/docker/daemon.json`
> (for example ArvanCloud's `https://docker.arvancloud.ir`) and restart Docker.

## 2. Configure

```bash
git clone <repository> sofreh && cd sofreh
cp .env.example .env
```

Edit `.env`:

| Variable | Value |
|---|---|
| `POSTGRES_PASSWORD` | a strong password |
| `JWT_ACCESS_SECRET` | `openssl rand -hex 32` |
| `PUBLIC_URL` / `CORS_ORIGINS` | your domain, e.g. `https://panel.example.ir` |
| `ADMIN_PHONES` | the mobile numbers of the admins |
| `OTP_DEV_MODE` | `false` (connect an SMS provider first) |
| `SEED_DEMO_DATA` | `false` (`true` only for a demo server; it wipes data on every start) |

## 3. Start

```bash
docker compose --profile full up -d --build
docker compose ps                      # all services healthy
curl http://localhost:8080/api/v1/health
```

- Admin panel: `http://<server>:8080/`
- API: `http://<server>:8080/api/v1` · Swagger: `http://<server>:8080/api/docs`

Database migrations run automatically when the API container starts.

## 4. HTTPS

Point your domain to the server and either terminate TLS at your provider/CDN (e.g. ArvanCloud CDN) or add a
`listen 443 ssl` server block with your certificate to `infra/nginx/default.conf` and expose port 443.

## 5. Mobile app

```bash
cd apps/mobile
flutter build apk --release --dart-define=API_URL=https://panel.example.ir        # Android (Cafe Bazaar / Myket)
flutter build ipa --release --dart-define=API_URL=https://panel.example.ir        # iOS (needs a Mac + Apple account)
```

## Operations

| Task | Command |
|---|---|
| Logs | `docker compose logs -f api` |
| Update to a new version | `git pull && docker compose --profile full up -d --build` |
| Database backup | `docker compose exec postgres pg_dump -U sofreh sofreh > backup-$(date +%F).sql` |
| Restore | `docker compose exec -T postgres psql -U sofreh sofreh < backup.sql` |
| Uploaded images | stored in the `uploads` volume; back it up with the database |
