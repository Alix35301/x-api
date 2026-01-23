# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN npm install -g pnpm@9

WORKDIR /app

# Copy monorepo root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy packages and API package.json
COPY packages ./packages
COPY apps/api/package.json ./apps/api/

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages

# Copy source files
COPY apps/api ./apps/api
COPY package.json pnpm-workspace.yaml ./
# Copy root .env for build-time configuration
COPY .env ./apps/api/.env

WORKDIR /app/apps/api

# Build NestJS application
ENV NODE_ENV=production
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy necessary runtime files
COPY apps/api/data-source-cli.ts ./apps/api/
COPY apps/api/src/migrations ./apps/api/src/migrations

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
