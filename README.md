# Expense Tracker API

NestJS backend for the Expense Tracker application.

## Prerequisites

- Node.js 20+
- pnpm 9+
- MySQL 8.0+ (or Docker)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the variables in `.env`:

```bash
# Database Configuration
DATABASE_URL=mysql://expense_user:expense_password@localhost:3306/expense_tracker

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=expense_user
MYSQL_PASSWORD=expense_password
MYSQL_DATABASE=expense_tracker

# Application Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

Generate a secure `JWT_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

Start MySQL with Docker Compose:

```bash
docker-compose up -d mysql
```

Wait for MySQL to be healthy (~10 seconds), then run migrations:

```bash
pnpm migration:run
```

#### Option B: Using Local MySQL

Ensure MySQL is running locally and create the database:

```sql
CREATE DATABASE expense_tracker;
CREATE USER 'expense_user'@'localhost' IDENTIFIED BY 'expense_password';
GRANT ALL PRIVILEGES ON expense_tracker.* TO 'expense_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run migrations:

```bash
pnpm migration:run
```

### 4. Seed Development Data (Optional)

```bash
pnpm seed:dev
```

### 5. Run Development Server

```bash
pnpm dev
```

API will be available at [http://localhost:3001](http://localhost:3001)

API documentation (Swagger) at [http://localhost:3001/api](http://localhost:3001/api)

### 6. Build for Production

```bash
pnpm build
pnpm start:prod
```

## Docker

### Full Stack with Docker Compose

Run both MySQL and API:

```bash
docker-compose up
```

This will:
- Start MySQL on port 3306
- Build and start the API on port 3001
- Automatically wait for MySQL to be healthy before starting API

### Production Build

```bash
docker build -t expense-tracker-api .

docker run -p 3001:3000 \
  -e DATABASE_URL=mysql://user:password@host:3306/db \
  -e JWT_SECRET=your_secret \
  -e CORS_ORIGIN=http://localhost:3000 \
  expense-tracker-api
```

## Project Structure

```
src/
├── auth/                 # Authentication module
├── users/                # Users module
├── expenses/             # Expenses module
├── categories/           # Categories module
├── bank-import/          # Bank import module
├── migration-supabase/   # Supabase migration utilities
├── seed/                 # Database seeding
└── common/               # Shared utilities and DTOs
```

## Available Scripts

### Development
- `pnpm dev` - Start development server with hot reload
- `pnpm start:dev` - Same as `pnpm dev`
- `pnpm start:debug` - Start with debugging enabled

### Production
- `pnpm build` - Build for production
- `pnpm start:prod` - Start production server

### Database & Migrations
- `pnpm migration:generate` - Generate new migration from entity changes
- `pnpm migration:run` - Run pending migrations
- `pnpm migration:revert` - Revert last migration
- `pnpm migration:create` - Create empty migration file
- `pnpm seed:dev` - Seed database with development data

### Testing
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage
- `pnpm test:e2e` - Run end-to-end tests

### Code Quality
- `pnpm lint` - Lint and fix code
- `pnpm format` - Format code with Prettier

### Docker
- `pnpm docker:build` - Build Docker image
- `pnpm docker:run` - Run with Docker Compose

### Other
- `pnpm clean` - Clean build artifacts and node_modules
- `pnpm migrate:supabase` - Migrate data from Supabase

## Technologies

- **NestJS 11** - Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM for database operations
- **MySQL 8.0** - Database
- **JWT** - Authentication
- **Swagger** - API documentation
- **Class Validator** - DTO validation
- **Bcrypt** - Password hashing

## API Documentation

Once the server is running, visit [http://localhost:3001/api](http://localhost:3001/api) for interactive Swagger documentation.

## Database Migrations

### Creating a New Migration

After modifying entities:

```bash
pnpm migration:generate src/migrations/DescriptiveNameHere
```

### Running Migrations

```bash
pnpm migration:run
```

### Reverting Migrations

```bash
pnpm migration:revert
```

## Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [MySQL Documentation](https://dev.mysql.com/doc)
