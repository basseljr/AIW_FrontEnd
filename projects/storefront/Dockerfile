# ─── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config files first for layer caching
COPY package*.json ./
COPY angular.json tsconfig.json tailwind.config.js postcss.config.js ./

# Install all deps (including devDependencies needed for build)
RUN npm ci --no-audit --no-fund

# Copy source
COPY projects/ ./projects/

# Build the storefront SSR bundle
# Output: dist/storefront/browser/ + dist/storefront/server/
RUN npx ng build storefront --configuration=production

# ─── Stage 2: Runtime ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install only runtime deps (dumb-init for proper PID 1 signal handling)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built output from builder stage
COPY --from=builder /app/dist/storefront ./dist/storefront

# Copy only production node_modules for express + compression
# (Angular SSR bundles the Angular runtime; only Express/compression are external)
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S storefront -u 1001 -G nodejs

# Set ownership
RUN chown -R storefront:nodejs /app

USER storefront

# Runtime environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Use dumb-init to reap zombie processes; node is PID 2
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/storefront/server/server.mjs"]
