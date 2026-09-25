# ── Build stage ───────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# Copier les fichiers de dépendances
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Copier les sources
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared puis api
RUN pnpm --filter @materiaux/shared build
RUN pnpm --filter @materiaux/api build
RUN pnpm --filter @materiaux/api exec prisma generate

# ── Production stage ──────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 3001

CMD ["node", "dist/index.js"]
