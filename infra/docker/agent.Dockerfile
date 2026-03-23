# ─── Agent Container ─────────────────────────────────────────────────────────
# One container is spawned per user by the provisioner service.
# Each container runs a single long-lived PersonalAgent process.

# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY agents/package.json ./
# Install only production deps in prod; all deps in dev
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev

# ── Development target (hot reload) ──────────────────────────────────────────
FROM base AS development
COPY agents/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY agents/ ./
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS build
COPY agents/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY agents/ ./
COPY tsconfig.base.json ../tsconfig.base.json
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Run as non-root for security
RUN addgroup -g 1001 -S nodejs && adduser -S agent -u 1001
USER agent

# dumb-init handles signals properly in Docker
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
