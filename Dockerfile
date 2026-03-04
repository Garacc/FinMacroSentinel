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

# Install build tools for native modules
RUN apk add --no-cache tzdata python3 make g++ libc-dev

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Rebuild better-sqlite3 for this environment
RUN npm rebuild better-sqlite3

# Copy built files
COPY --from=builder /app/dist/ ./dist/

# Copy package.json for rebuild
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Create output directory
RUN mkdir -p output

# Set timezone
ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

# Default command runs in scheduled mode
CMD ["npm", "start", "--", "--schedule"]
