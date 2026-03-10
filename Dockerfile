# FinMacroSentinel - Dockerfile
# Node.js application for automated financial news analysis

FROM node:20-alpine AS builder

# Install build tools for native modules
RUN apk add --no-cache python3 make g++ libc-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper PID 1 behavior
RUN apk add --no-cache dumb-init

# Install build tools
RUN apk add --no-cache tzdata python3 make g++ libc-dev

# Copy package files
COPY package*.json ./

# Install production dependencies - force build from source for better-sqlite3
RUN npm install --omit=dev --build-from-source=better-sqlite3

# Copy built files
COPY --from=builder /app/dist/ ./dist/

# Create output directory
RUN mkdir -p output

# Set timezone
ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

# Install cron
RUN apk add --no-cache dcron

# Create cron script
RUN echo '#!/bin/sh\ncd /app\nnode dist/index.js --schedule > /proc/1/fd/1 2>&1' > /app/run-scheduler.sh && chmod +x /app/run-scheduler.sh

# Setup crontab
RUN echo '* * * * * /app/run-scheduler.sh' > /etc/crontabs/root

# Use dumb-init as PID 1, which properly handles child processes and signals
ENTRYPOINT ["dumb-init", "--"]

# Default command runs cron
CMD ["crond", "-f", "-l", "2"]
