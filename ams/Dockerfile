# Pre-built deployment — no npm install or npm build inside Docker.
# Build is done on the host: `npm run build`
# Then Docker just copies the pre-built output.

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Create system user for safety
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (Next.js output.standalone contains server.js)
COPY --chown=nextjs:nodejs .next/standalone ./
# Copy static assets (CSS, JS chunks)
COPY --chown=nextjs:nodejs .next/static ./.next/static
# Copy public folder (images, fonts, etc.)
COPY --chown=nextjs:nodejs public ./public

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
