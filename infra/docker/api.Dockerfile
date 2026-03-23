# ─── API Container ────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY api/package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev

# ── Development target (hot reload) ──────────────────────────────────────────
FROM base AS development
COPY api/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY api/ ./
EXPOSE 4000
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS build
COPY api/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY api/ ./
COPY tsconfig.base.json ../tsconfig.base.json
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

RUN addgroup -g 1001 -S nodejs && adduser -S api -u 1001
USER api

EXPOSE 4000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
