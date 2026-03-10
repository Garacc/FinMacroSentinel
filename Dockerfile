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

# Use dumb-init as PID 1
ENTRYPOINT ["dumb-init", "--"]

# Run scheduler with crontab - pass all env vars to cron
CMD ["sh", "-c", \
  "echo '#!/bin/sh' > /app/scheduler-cron.sh && " \
  "echo 'export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}' >> /app/scheduler-cron.sh && " \
  "echo 'export ANTHROPIC_MODEL=${ANTHROPIC_MODEL}' >> /app/scheduler-cron.sh && " \
  "echo 'export ANTHROPIC_API_ENDPOINT=${ANTHROPIC_API_ENDPOINT}' >> /app/scheduler-cron.sh && " \
  "echo 'export FEISHU_WEBHOOK_URL=${FEISHU_WEBHOOK_URL}' >> /app/scheduler-cron.sh && " \
  "echo 'export FEISHU_WEBHOOK_SECRET=${FEISHU_WEBHOOK_SECRET}' >> /app/scheduler-cron.sh && " \
  "echo 'export FEISHU_APP_ID=${FEISHU_APP_ID}' >> /app/scheduler-cron.sh && " \
  "echo 'export FEISHU_APP_SECRET=${FEISHU_APP_SECRET}' >> /app/scheduler-cron.sh && " \
  "echo 'export FEISHU_CHAT_ID=${FEISHU_CHAT_ID}' >> /app/scheduler-cron.sh && " \
  "echo 'export FRED_API_KEY=${FRED_API_KEY}' >> /app/scheduler-cron.sh && " \
  "echo 'export FINNHUB_API_KEY=${FINNHUB_API_KEY}' >> /app/scheduler-cron.sh && " \
  "echo 'export OUTPUT_DIR=${OUTPUT_DIR}' >> /app/scheduler-cron.sh && " \
  "echo 'export SCHEDULE_CRON=${SCHEDULE_CRON}' >> /app/scheduler-cron.sh && " \
  "echo 'export TZ=${TZ}' >> /app/scheduler-cron.sh && " \
  "echo 'export NODE_ENV=${NODE_ENV}' >> /app/scheduler-cron.sh && " \
  "echo 'exec node /app/dist/index.js --schedule' >> /app/scheduler-cron.sh && " \
  "chmod +x /app/scheduler-cron.sh && " \
  "echo '* * * * * /app/scheduler-cron.sh' > /etc/crontabs/root && " \
  "crond -f -l 2"]
