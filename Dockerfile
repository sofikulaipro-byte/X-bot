# ---------- Build stage ----------
FROM node:18-alpine AS builder

# Install build deps
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /usr/src/app

# Copy package manifests first for better caching
COPY package.json package-lock.json* ./

# Install dependencies (use npm ci if package-lock exists)
RUN if [ -f package-lock.json ]; then npm ci --production; else npm install --production; fi

# Copy app sources
COPY . .

# ---------- Final runtime stage ----------
FROM node:18-alpine AS runtime

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

# Copy node_modules and app code from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port for Render health checks
EXPOSE ${PORT}

# Use non-root user
USER appuser

# Start the app
CMD ["node", "index.js"]
