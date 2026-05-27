# ── Stage 1: install deps ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/

RUN npm ci --ignore-scripts

# ── Stage 2: generate prisma + build ───────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY packages/types ./packages/types
COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY turbo.json ./

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build NestJS API
RUN npm run build --workspace=@dawolink/api

# ── Stage 3: production runner ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Startup: run DB migrations, then start server
COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 4000
CMD ["./entrypoint.sh"]
