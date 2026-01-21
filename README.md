# Expense Tracker Monorepo

A full-stack expense tracking application built with Next.js and NestJS, managed with Turborepo.

## Project Structure

```
.
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── packages/
│   └── shared-types/ # Shared TypeScript types and DTOs
├── turbo.json        # Turborepo configuration
└── package.json      # Root package.json
```

## Prerequisites

**Option 1: Local Development**
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- MySQL or PostgreSQL

**Option 2: Docker (Recommended)**
- Docker Engine 20.10+
- Docker Compose v2.0+

## Getting Started

### 🐳 Docker Setup (Recommended)

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed instructions.

**Quick Start:**

```bash
# 1. Create environment file
cp .env.docker .env

# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker-compose exec api pnpm migration:run

# 4. Access the apps
# Web: http://localhost:3000
# API: http://localhost:3001
```

### 💻 Local Development Setup

### 1. Install pnpm (if not already installed)

```bash
npm install -g pnpm@9
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup environment variables

Create `.env` files in both `apps/web` and `apps/api` directories. Use the `.env.example` files as templates.

### 4. Run database migrations (API)

```bash
cd apps/api
pnpm migration:run
```

### 5. Development

Run both apps in development mode:

```bash
# From root directory
pnpm dev
```

Or run individually:

```bash
# Frontend only
cd apps/web
pnpm dev

# API only
cd apps/api
pnpm dev
```

## Available Scripts

### Root Level

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm test` - Run tests for all apps
- `pnpm clean` - Clean all build artifacts and node_modules

### Web App (apps/web)

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### API (apps/api)

- `pnpm dev` - Start NestJS in watch mode
- `pnpm build` - Build for production
- `pnpm start:prod` - Start production server
- `pnpm test` - Run tests
- `pnpm migration:generate` - Generate new migration
- `pnpm migration:run` - Run migrations
- `pnpm seed:dev` - Seed database with development data

## Shared Types

The `@expense-tracker/shared-types` package contains TypeScript interfaces and DTOs shared between the frontend and backend. This ensures type safety across the entire application.

Import shared types like this:

```typescript
import { User, Expense, CreateExpenseDto } from '@expense-tracker/shared-types';
```

## Tech Stack

- **Frontend**: Next.js 16, React 18, TailwindCSS, Radix UI
- **Backend**: NestJS, TypeORM, PostgreSQL/MySQL
- **Monorepo**: Turborepo, pnpm workspaces
- **Authentication**: JWT

## Development Workflow

1. Make changes in the appropriate app or shared package
2. Turborepo will automatically detect changes and rebuild dependencies
3. Changes to `shared-types` will trigger rebuilds in apps that depend on it

## Database Migrations

Database logic and migrations are handled exclusively in the API (`apps/api`). The frontend communicates with the database through API endpoints only.

To create a new migration:

```bash
cd apps/api
pnpm migration:generate src/migrations/MigrationName
```

## Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @expense-tracker/web build
pnpm --filter @expense-tracker/api build
```

## License

MIT
