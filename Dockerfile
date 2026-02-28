# FinMacroSentinel - Dockerfile
# Node.js application for automated financial news analysis

FROM node:18-alpine AS builder

# Install dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install tzdata for timezone support
RUN apk add --no-cache tzdata

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist/ ./dist/

# Create output directory
RUN mkdir -p output

# Set timezone
ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

# Default command runs in scheduled mode
# Use "npm start -- --schedule" for scheduled mode
# Use "npm start" for one-time run
CMD ["npm", "start", "--", "--schedule"]
