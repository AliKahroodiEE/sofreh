# syntax=docker/dockerfile:1
# Sofreh API — production image (multi-stage).

# ---- build: install all dependencies, generate the Prisma client, compile TypeScript
FROM node:24-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build && npm prune --omit=dev

# ---- runtime: only what the server needs
FROM node:24-alpine
RUN apk add --no-cache openssl tini
ENV NODE_ENV=production PORT=4100
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json docker-entrypoint.sh ./
RUN mkdir -p uploads && chown node:node uploads && chmod +x docker-entrypoint.sh
USER node
EXPOSE 4100
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:4100/api/v1/health || exit 1
ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]
