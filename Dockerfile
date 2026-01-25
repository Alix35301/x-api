# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build NestJS application
ENV NODE_ENV=production
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production install
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (needed for TypeScript migrations and TypeORM CLI)
RUN pnpm install --frozen-lockfile --prod=false

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files (needed for migrations and data-source-cli.ts)
COPY data-source-cli.ts tsconfig.json ./
COPY src ./src

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
