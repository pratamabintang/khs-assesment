# =========================
# Build stage (NestJS)
# =========================
FROM node:20-alpine AS builder

WORKDIR /app/nestjs

# Copy only package files first (better cache)
COPY nestjs/package*.json ./

# Install ALL deps (including devDeps) because build needs them + migration tools are in devDeps
RUN npm ci && npm cache clean --force

# Copy the rest of the backend source
COPY nestjs/ ./

# Build NestJS -> outputs to dist/
RUN npm run build


# =========================
# Tools stage (for migrations)
# - contains devDeps + source + dist
# =========================
FROM node:20-alpine AS tools

WORKDIR /app/nestjs
ENV NODE_ENV=development

# Copy everything from builder (node_modules includes devDeps)
COPY --from=builder /app/nestjs /app/nestjs

# Default command (can be overridden by docker-compose)
CMD ["sh", "-c", "node -v && npm -v && ls -la"]


# =========================
# Production stage
# - only prod deps + dist
# =========================
FROM node:20-alpine AS production

WORKDIR /app/nestjs
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Install production deps only
COPY nestjs/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built output
COPY --from=builder --chown=nestjs:nodejs /app/nestjs/dist ./dist

# Switch to non-root user
USER nestjs

# Health check without curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.API_PORT || 3000), (r) => { if (r.statusCode < 200 || r.statusCode >= 400) process.exit(1); }).on('error', () => process.exit(1));"

EXPOSE 3000

# IMPORTANT: dist kamu ada di dist/src/main.js (bukan dist/main.js)
CMD ["node", "dist/src/main.js"]
