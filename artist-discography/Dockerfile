# syntax=docker/dockerfile:1

# 1. Base dependencies stage
FROM oven/bun:1-slim AS deps
WORKDIR /app

# Copy dependency specifications
COPY package.json bun.lock ./

# Install project dependencies
RUN bun install --frozen-lockfile

# 2. Build stage
FROM oven/bun:1-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app in standalone output mode
RUN bun run build

# 3. Production runner stage
FROM node:24-bookworm-slim AS runner
WORKDIR /app

# Install ffmpeg for audio transcoding and curl for container healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system user and group for container security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Set up data directories with appropriate permissions
RUN mkdir -p /app/data /app/data/cache/images /app/data/cache/audio /app/data/projects && \
    chown -R nextjs:nodejs /app

# Copy built application assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose HTTP port
EXPOSE 3000

# Health check to ensure service responds
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the standalone Next.js server
CMD ["node", "server.js"]
