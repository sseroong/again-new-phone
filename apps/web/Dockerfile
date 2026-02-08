# ============================================
# Stage 1: Base - pnpm install with cache
# ============================================
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy workspace config + all package.json files for cache-optimal install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
# Dummy package.json for unused workspaces
RUN mkdir -p apps/api apps/admin
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/

RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build shared + ui packages
# ============================================
FROM base AS build-shared

COPY packages/shared/ packages/shared/
COPY packages/ui/ packages/ui/
COPY tsconfig.base.json ./
RUN pnpm --filter @phone-marketplace/shared build

# ============================================
# Stage 3: Build Nuxt app
# ============================================
FROM build-shared AS build

COPY apps/web/ apps/web/
RUN pnpm --filter @phone-marketplace/web build

# ============================================
# Stage 4: Production image (Nuxt output only)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nuxtjs && \
    adduser --system --uid 1001 nuxtjs

# Copy Nuxt standalone output
COPY --from=build /app/apps/web/.output/ .output/

USER nuxtjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
