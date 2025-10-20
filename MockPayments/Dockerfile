# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY seed ./seed

# Build TypeScript and copy seed to dist
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Copy only what we need to run
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist/seed ./dist/seed

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3   CMD node -e "fetch('http://localhost:3001/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
