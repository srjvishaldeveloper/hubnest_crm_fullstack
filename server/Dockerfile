# ---- Build stage ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S crmgroup && adduser -S crmuser -G crmgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=crmuser:crmgroup . .

RUN mkdir -p logs && chown -R crmuser:crmgroup logs

USER crmuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
