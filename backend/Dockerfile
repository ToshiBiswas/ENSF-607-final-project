FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Start the server (CommonJS)
CMD ["node", "-r", "dotenv/config", "src/server.js"]
