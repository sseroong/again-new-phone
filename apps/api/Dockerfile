# ============================================
# Stage 1: Base - pnpm install with cache
# ============================================
FROM node:20-alpine AS base

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy workspace config + all package.json files for cache-optimal install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
# Dummy package.json for unused workspaces (pnpm requires them)
RUN mkdir -p apps/web apps/admin packages/ui
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build shared package (CJS)
# ============================================
FROM base AS build-shared

COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN pnpm --filter @phone-marketplace/shared build

# ============================================
# Stage 3: Build API (Prisma + NestJS)
# ============================================
FROM build-shared AS build

COPY prisma/ prisma/
RUN pnpm db:generate

COPY apps/api/ apps/api/
RUN pnpm --filter @phone-marketplace/api build

# ============================================
# Stage 4: Production image
# ============================================
FROM base AS production

# Create non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy Prisma schema and generate client (pnpm 경로 호환 보장)
COPY --from=build /app/prisma/ prisma/
RUN pnpm db:generate

# Copy built shared package
COPY --from=build /app/packages/shared/dist/ packages/shared/dist/

# Copy built API
COPY --from=build /app/apps/api/dist/ apps/api/dist/

# Create uploads directory (process.cwd() = /app → /app/uploads/products)
RUN mkdir -p uploads/products && chown -R nestjs:nestjs uploads

USER nestjs

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
