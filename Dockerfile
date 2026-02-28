# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Development ----
FROM node:20-alpine AS development

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY drizzle.config.js ./
COPY drizzle ./drizzle
COPY src ./src

RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5173

CMD ["node", "--watch", "src/index.js"]

# ---- Stage 3: Production ----
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY drizzle.config.js ./
COPY drizzle ./drizzle
COPY src ./src

RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["npm", "start"]