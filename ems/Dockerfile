# Multi-stage Dockerfile for DVLA EMS Tracking System Standalone
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies (legacy peer deps handles React 19 / Next.js)
RUN npm install --legacy-peer-deps

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
ENV PORT=3002

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output, static assets, and public directory
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Receipt uploads volume directory
RUN mkdir -p /app/uploads/ems && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]
