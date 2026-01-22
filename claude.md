# Expense Tracker API - Documentation for AI Assistants

## Project Overview

**Name:** Expense Tracker API
**Framework:** NestJS with TypeScript
**Purpose:** Backend API for tracking personal/business expenses with comprehensive analytics
**Database:** MySQL 8.0 with TypeORM
**Package Manager:** pnpm

This is a production-ready expense tracking API with user authentication, expense management, and advanced dashboard analytics featuring trend analysis and period comparisons.

## Tech Stack

### Core Technologies
- **Runtime:** Node.js 20+
- **Framework:** NestJS 11.x
- **Language:** TypeScript 5.7+
- **Database ORM:** TypeORM 0.3.28
- **Database:** MySQL 8.0 (supports PostgreSQL via pg adapter)
- **Package Manager:** pnpm

### Key Dependencies
- **Authentication:** `@nestjs/jwt` 11.x (JWT tokens)
- **Validation:** `class-validator` 0.14.x, `class-transformer` 0.5.x
- **Date Handling:** `dayjs` 1.11.x
- **Password Hashing:** `bcrypt` 6.x, `bcryptjs` 3.x
- **API Documentation:** `@nestjs/swagger` 11.x
- **Testing:** Jest 29.x (unit & e2e tests)

## Project Structure

```
/home/ali/code/personal/app/exp-app-api/
├── src/
│   ├── auth/           # JWT authentication, guards, and strategies
│   ├── users/          # User management (CRUD, entities, DTOs)
│   ├── expense/        # Expense CRUD operations and business logic
│   ├── category/       # Expense category management
│   ├── dashboard/      # Dashboard metrics & analytics (recently added)
│   ├── device-service/ # Device tracking and management
│   ├── database/       # Database configuration and setup
│   ├── migrations/     # TypeORM database migrations
│   ├── seed/           # Database seeding scripts
│   ├── configs/        # Application configuration files
│   ├── common/         # Shared utilities, decorators, filters
│   ├── app.module.ts   # Root application module
│   └── main.ts         # Application entry point
├── test/               # E2E tests
├── docker-compose.yml  # Docker services configuration
├── Dockerfile          # Container build configuration
├── data-source-cli.ts  # TypeORM CLI configuration
├── package.json        # Dependencies and scripts
├── .env                # Environment variables (gitignored)
└── .env.example        # Environment template
```

## Key Features

### 1. Dashboard Analytics (Recently Implemented)

**Location:** `src/dashboard/`
**Endpoint:** `GET /dashboard/metrics`
**Authentication:** Protected by `@UseGuards(AuthGuard)`

The dashboard provides comprehensive expense metrics with trend analysis:

#### Metrics Returned
- **Daily Metrics:** Today vs Yesterday
  - Total expenses for today
  - Total expenses for yesterday
  - Percentage change
  - Trend indicator (increase/decrease/neutral)

- **Weekly Metrics:** This week vs Previous week
  - Total expenses for current week
  - Total expenses for previous week
  - Percentage change
  - Trend indicator

- **Monthly Metrics:** This month vs Previous month
  - Total expenses for current month
  - Total expenses for previous month
  - Percentage change
  - Trend indicator

- **Daily Aggregates:** Last 30 days of daily totals
- **Weekly Aggregates:** Last 14 weeks of weekly totals
- **Monthly Aggregates:** Last 6 months of monthly totals

#### Implementation Details
- **Controller:** `src/dashboard/dashboard.controller.ts:11` - Defines the `/dashboard/metrics` endpoint
- **Service:** `src/dashboard/dashboard.service.ts` - Orchestrates metric calculations
  - `getMetrics()` - Main entry point
  - `getTodaysMetrics()` - Daily comparison logic
  - `getThisWeeksMetrics()` - Weekly comparison logic
  - `getThisMonthsMetrics()` - Monthly comparison logic
- **Query Service:** `src/dashboard/query.service.ts` - Database queries for metrics
  - Uses TypeORM query builder with MySQL date functions
  - Performs date-based aggregations

#### Trend Calculation
Trends are calculated by comparing current periods with previous periods:
- Percentage change: `((current - previous) / previous) * 100`
- Trend: `"increase"` if positive, `"decrease"` if negative, `"neutral"` if previous is 0
- Handles division by zero gracefully (returns null for percentage, "neutral" for trend)

#### Tests
- **E2E Tests:** `test/dashboard/dashboard.e2e-spec.ts`

### 2. User Authentication

**Location:** `src/auth/`
**Method:** JWT (JSON Web Tokens)
**Features:**
- User registration and login
- JWT token generation and validation
- Auth guards for route protection
- Password hashing with bcrypt

### 3. Expense Management

**Location:** `src/expense/`
**Features:**
- Create, read, update, delete expenses
- Associate expenses with users and categories
- Date-based filtering
- Amount tracking

### 4. Category Management

**Location:** `src/category/`
**Features:**
- Create and manage expense categories
- Link categories to expenses
- User-specific categories

### 5. Database Management

**Migrations:**
- Location: `src/migrations/`
- Managed via TypeORM CLI
- Scripts: `pnpm migration:generate`, `pnpm migration:run`, `pnpm migration:revert`

**Seeding:**
- Location: `src/seed/`
- Script: `pnpm seed:dev` (development)
- Uses `@faker-js/faker` for generating test data

## Development Setup

### Docker-Based Development

The project runs entirely in Docker containers. Two main services:
1. `nestjs-api` - NestJS application (accessible on port 3002, internal port 3000)
2. `app-mysql-db` - MySQL 8.0 database (port 3306)

#### Prerequisites
- Docker and Docker Compose installed
- pnpm (optional for local development)

#### Starting the Application

```bash
# Start all containers
docker-compose up -d

# View logs
docker logs -f nestjs-api

# Install dependencies (if needed)
docker exec -it nestjs-api pnpm install

# Run database migrations
docker exec -it nestjs-api pnpm migration:run

# Seed database with test data (optional)
docker exec -it nestjs-api pnpm seed:dev

# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

#### Development Commands

```bash
# Start development server (usually auto-starts via docker-compose)
docker exec -it nestjs-api pnpm start:dev

# Run unit tests
docker exec -it nestjs-api pnpm test

# Run e2e tests
docker exec -it nestjs-api pnpm test:e2e

# Run tests with coverage
docker exec -it nestjs-api pnpm test:cov

# Format code
docker exec -it nestjs-api pnpm format

# Lint code
docker exec -it nestjs-api pnpm lint

# Build for production
docker exec -it nestjs-api pnpm build
```

#### Database Operations

```bash
# Generate a new migration (replace MigrationName)
docker exec -it nestjs-api pnpm migration:generate src/migrations/MigrationName

# Run pending migrations
docker exec -it nestjs-api pnpm migration:run

# Revert last migration
docker exec -it nestjs-api pnpm migration:revert

# Run migrations in test environment
docker exec -it nestjs-api pnpm migration:run:test

# Seed development database
docker exec -it nestjs-api pnpm seed:dev
```

### Access URLs

- **API (Docker):** http://localhost:3002
- **API (Traefik - if configured):** https://api.localhost
- **MySQL:** localhost:3306

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database Configuration
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=nestjs_user
MYSQL_PASSWORD=nestjs_password
MYSQL_DATABASE=nestjs_db
MYSQL_ROOT_PASSWORD=root_password

# Connection string (alternative format)
DATABASE_URL="mysql://nestjs_user:nestjs_password@mysql:3306/nestjs_db"

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d

# Application
NODE_ENV=development
PORT=3000
```

## Database Schema

### Main Entities

1. **User**
   - User accounts and authentication
   - One-to-many relationship with Expenses
   - One-to-many relationship with Categories

2. **Expense**
   - Expense records with amount and date
   - Belongs to User (many-to-one)
   - Belongs to Category (many-to-one)
   - Fields: id, amount, description, date, created_at, updated_at

3. **Category**
   - Expense categorization
   - Belongs to User (many-to-one)
   - One-to-many relationship with Expenses

### Date-Based Aggregations

The dashboard queries use MySQL date functions for aggregations:
- `DATE()` - Extract date from datetime
- `WEEK()` - Get week number
- `MONTH()` - Get month number
- `YEAR()` - Get year number
- Grouping by date/week/month for trend analysis

## Important Files & Locations

### Configuration
- `data-source-cli.ts` - TypeORM CLI configuration for migrations
- `src/configs/` - Application configuration modules
- `src/database/` - Database module setup
- `.env` - Environment variables (not committed)
- `.env.example` - Environment template

### Docker
- `docker-compose.yml` - Service definitions for MySQL and NestJS
- `Dockerfile` - Container build instructions
- Container names: `nestjs-api`, `app-mysql-db`

### Testing
- `test/` - E2E test suites
- `src/**/*.spec.ts` - Unit tests (co-located with source files)
- `test/jest-e2e.json` - E2E Jest configuration

### Package Management
- Uses `pnpm` exclusively
- `package.json` - Dependencies and scripts
- Requires Node.js 20+ and npm/pnpm 10+

## Working with the Dashboard

### Adding New Metrics

1. **Add query method** in `src/dashboard/query.service.ts`
   - Use TypeORM query builder
   - Leverage MySQL date functions for aggregations
   - Return raw results or entity objects

2. **Add business logic** in `src/dashboard/dashboard.service.ts`
   - Calculate trends and percentages
   - Compare current vs previous periods
   - Handle edge cases (division by zero, null values)

3. **Update controller** in `src/dashboard/dashboard.controller.ts`
   - Add new endpoint or extend existing response
   - Ensure `@UseGuards(AuthGuard)` is applied

4. **Add tests** in `test/dashboard/dashboard.e2e-spec.ts`
   - Test happy path and edge cases
   - Verify calculations and trend logic
   - Test authentication requirements

### Common Dashboard Patterns

**Percentage Change Calculation:**
```typescript
const percentDiff = Number(previous) == 0
  ? null
  : ((Number(current) - Number(previous)) / Number(previous)) * 100;
```

**Trend Determination:**
```typescript
const trend = percentDiff !== null
  ? (percentDiff < 0 ? "decrease" : "increase")
  : "neutral";
```

**Date Formatting with dayjs:**
```typescript
import dayjs from 'dayjs';

const today = dayjs();
const yesterday = dayjs().subtract(1, "day");
const formattedDate = today.format("YYYY-MM-DD");
```

## Testing Strategy

### Unit Tests
- Located alongside source files (`*.spec.ts`)
- Run with: `pnpm test`
- Coverage: `pnpm test:cov`

### E2E Tests
- Located in `test/` directory
- Run with: `pnpm test:e2e`
- Uses supertest for HTTP assertions
- Tests full request/response cycle with authentication

### Test Database
- Configure via `NODE_ENV=test`
- Run migrations: `pnpm migration:run:test`
- Isolated from development database

## Common Tasks

### Adding a New Feature Module

1. Generate module: `nest g module feature-name`
2. Generate service: `nest g service feature-name`
3. Generate controller: `nest g controller feature-name`
4. Create entity in module directory
5. Add module to `app.module.ts` imports
6. Create DTOs for validation
7. Add authentication guards if needed
8. Write unit and e2e tests

### Creating a Database Migration

```bash
# Make changes to entities
docker exec -it nestjs-api pnpm migration:generate src/migrations/DescriptiveName

# Review generated migration in src/migrations/
# Apply migration
docker exec -it nestjs-api pnpm migration:run
```

### Debugging

- Check container logs: `docker logs -f nestjs-api`
- Access container shell: `docker exec -it nestjs-api sh`
- Check MySQL: `docker exec -it app-mysql-db mysql -u nestjs_user -p`
- View running containers: `docker ps`

## API Documentation

The project includes Swagger/OpenAPI documentation:
- Access at: `http://localhost:3002/api` (when running)
- Auto-generated from decorators and DTOs
- Interactive API testing interface

## Security Considerations

- All passwords hashed with bcrypt
- JWT tokens for stateless authentication
- Auth guards protect sensitive endpoints
- Input validation with `class-validator`
- SQL injection prevention via TypeORM parameterized queries
- Environment variables for sensitive configuration

## Code Style & Conventions

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with Prettier
- **Formatting:** Run `pnpm format` before commits
- **Imports:** Use absolute imports where configured
- **DTOs:** Use `class-validator` decorators for validation
- **Services:** Keep business logic in services, not controllers
- **Controllers:** Thin controllers that delegate to services

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs nestjs-api

# Rebuild container
docker-compose down
docker-compose up -d --build
```

### Database Connection Issues
- Verify environment variables in `.env`
- Ensure MySQL container is running: `docker ps`
- Check network connectivity: `docker network ls`
- Verify `MYSQL_HOST=mysql` (container name, not localhost)

### Migration Errors
```bash
# Revert last migration
docker exec -it nestjs-api pnpm migration:revert

# Check migration status
docker exec -it nestjs-api pnpm typeorm migration:show -d data-source-cli.ts
```

### Port Conflicts
- If port 3002 or 3306 is in use, modify `docker-compose.yml`
- Update corresponding environment variables

## Recent Changes

### Dashboard Feature (January 2026)
- Implemented comprehensive dashboard metrics endpoint
- Added daily, weekly, and monthly trend analysis
- Created aggregation queries for last 30 days, 14 weeks, and 6 months
- Percentage change calculations with trend indicators
- Full e2e test coverage for dashboard functionality
- Files modified:
  - `src/dashboard/dashboard.controller.ts`
  - `src/dashboard/dashboard.service.ts`
  - `src/dashboard/query.service.ts`
  - `test/dashboard/dashboard.e2e-spec.ts`

## Additional Resources

- **NestJS Documentation:** https://docs.nestjs.com
- **TypeORM Documentation:** https://typeorm.io
- **MySQL Documentation:** https://dev.mysql.com/doc/
- **dayjs Documentation:** https://day.js.org

## Notes for AI Assistants

- This project uses **pnpm**, not npm or yarn
- All development happens inside Docker containers
- Use `docker exec -it nestjs-api` prefix for all commands
- Database queries use TypeORM query builder, not raw SQL (except for aggregations)
- Date handling prefers `dayjs` over native Date objects
- All endpoints should be protected with `@UseGuards(AuthGuard)` unless public
- DTOs must use `class-validator` decorators
- Tests are critical - maintain coverage when adding features
- The codebase follows NestJS best practices and conventions
- Environment variables are read from `.env` via `@nestjs/config`
