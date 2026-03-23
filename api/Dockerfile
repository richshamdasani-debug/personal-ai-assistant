# ─── API Container ────────────────────────────────────────────────────────────
# Symlink to infra/docker/api.Dockerfile for docker-compose context resolution.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

FROM base AS deps
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

FROM base AS development
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .
EXPOSE 4000
CMD ["npx", "tsx", "watch", "src/index.ts"]

FROM base AS build
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .
RUN npm run build

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
