# Multi-stage build for smaller production image
FROM node:20-alpine AS base
WORKDIR /app

# Install production deps separately to leverage caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose port (Cloud Run / other platforms will honor PORT env variable; this is a hint only)
EXPOSE 8080

# Set NODE_ENV
ENV NODE_ENV=production

# Default command (Cloud platforms usually inject PORT); app reads PORT from env (config.js uses process.env.PORT or 3000)
CMD ["node", "server.js"]
