# ─── Agent Container ─────────────────────────────────────────────────────────

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

RUN addgroup -g 1001 -S nodejs && adduser -S agent -u 1001
USER agent

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
