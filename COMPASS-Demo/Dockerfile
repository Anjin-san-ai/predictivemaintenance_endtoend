# Multi-stage build for Next.js 15 — Azure App Service deployment
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built output and runtime deps
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/public ./public
COPY --from=base /app/src/data ./src/data

EXPOSE 8080

CMD ["npm", "run", "start", "--", "--port", "8080"]
