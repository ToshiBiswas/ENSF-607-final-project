# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
