# syntax=docker/dockerfile:1
# Sofreh admin panel — production image (Next.js standalone output).
#
#   docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 -t sofreh-admin .
#   docker run -p 3100:3100 sofreh-admin
#
# NEXT_PUBLIC_API_URL is inlined into the browser bundle at build time: it is the
# origin the *browser* uses for the API (behind Nginx: the same origin as the panel).

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0
# The standalone folder contains server.js and only the node_modules it needs.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3100
CMD ["node", "server.js"]
