# Multi-stage Dockerfile for DVLA Asset Management System Standalone
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies (legacy peer deps handles React 19 / Next.js)
RUN npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# Copy application source code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js standalone application
RUN npm run build

# Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Create system user for safety
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (Next.js output.standalone contains server.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static assets (CSS, JS chunks)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public folder (images, fonts, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
