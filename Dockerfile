FROM node:26-alpine AS base

# ----------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

RUN if [ ! -d ./node_modules/@libsql/linux-arm64-musl ]; then \
        mkdir -p ./node_modules/@libsql/linux-arm64-musl; \
    fi

# ----------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ----------------------------
FROM base AS runner
RUN apk add --no-cache xz
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/migrations ./migrations

COPY --from=deps \
    /app/node_modules/@libsql/linux-arm64-musl \
    ./node_modules/@libsql/linux-arm64-musl

ARG GIT_HASH
ENV GIT_HASH=${GIT_HASH} \
    DB_PATH=data/prod.db

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
