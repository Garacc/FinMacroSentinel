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

# Run scheduler with crontab
CMD ["sh", "-c", "echo '* * * * * node /app/dist/index.js --schedule' > /etc/crontabs/root && crond -f -l 2"]
