# Supabase to MySQL Migration Guide

## Overview

This guide documents how to migrate expense and category data from Supabase to MySQL in production.

**Source:** Supabase Production Database
- URL: `https://ixfkqcydmtjlyfahrjaq.supabase.co`
- Tables: `expense_categories`, `expenses`

**Target:** MySQL Database
- Tables: `categories`, `expenses`

## Prerequisites

Before running the migration:

1. ✅ Application is deployed to production
2. ✅ MySQL database is running and accessible
3. ✅ All users from Supabase have been migrated to MySQL (matched by email)
4. ✅ Environment variables are configured
5. ✅ Database backup has been created

## Environment Variables

Ensure these are set in your production environment (`.env` or deployment config):

```bash
# Supabase Configuration
SUPABASE_URL=https://ixfkqcydmtjlyfahrjaq.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Migration Options
MIGRATION_DRY_RUN=true                    # Set to 'false' for actual migration
MIGRATION_BATCH_SIZE=500                   # Number of expenses per batch
MIGRATION_CATEGORY_STRATEGY=SKIP           # SKIP|RENAME|REPLACE
MIGRATION_SKIP_MISSING_USERS=false         # Halt if users are missing

# MySQL Configuration (should already be set)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=db
```

## Migration Process

### Step 1: Run Dry Run

**Purpose:** Validate data without making changes

```bash
# Docker environment
docker exec -it expense-tracker-api sh -c "MIGRATION_DRY_RUN=true pnpm run migrate:supabase"

# Or if deployed on VM/server
cd /path/to/app/apps/api
MIGRATION_DRY_RUN=true npm run migrate:supabase
```

**Expected Output:**
```
✓ Migration completed successfully!

Categories imported: 0
Expenses imported: 0
Duration: X.XXs
```

**Review the logs for:**
- ✅ Valid: true
- ✅ Missing Users: 0
- ✅ Invalid Records: 0
- ✅ Total categories/expenses to be migrated

### Step 2: Backup Database

**CRITICAL:** Always backup before migration!

```bash
# Docker environment
docker exec mysql mysqldump -u user -ppassword db > /backup/supabase_migration_$(date +%Y%m%d_%H%M%S).sql

# Or direct MySQL access
mysqldump -h localhost -u user -ppassword db > /backup/supabase_migration_$(date +%Y%m%d_%H%M%S).sql
```

**Verify backup:**
```bash
ls -lh /backup/supabase_migration_*.sql
```

### Step 3: Run Actual Migration

**Docker environment:**
```bash
docker exec -it expense-tracker-api sh -c "MIGRATION_DRY_RUN=false pnpm run migrate:supabase"
```

**VM/Server environment:**
```bash
cd /path/to/app/apps/api
MIGRATION_DRY_RUN=false npm run migrate:supabase
```

**Expected Output:**
```
✓ Migration completed successfully!

Categories imported: 7
Expenses imported: 645
Duration: X.XXs
```

### Step 4: Verify Migration

**Check record counts:**
```bash
docker exec -it mysql mysql -u user -ppassword db -e "
SELECT
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM expenses) as expenses;
"
```

**Expected Results:**
- Categories: 7 (or more if categories already existed)
- Expenses: 645 (or your actual count from Supabase)

**Verify user mappings (no NULL user_id):**
```bash
docker exec -it mysql mysql -u user -ppassword db -e "
SELECT COUNT(*) as null_user_count
FROM expenses
WHERE user_id IS NULL;
"
```

**Expected:** `null_user_count: 0`

**Verify category mappings (no NULL category_id):**
```bash
docker exec -it mysql mysql -u user -ppassword db -e "
SELECT COUNT(*) as null_category_count
FROM expenses
WHERE category_id IS NULL;
"
```

**Expected:** `null_category_count: 0`

**Sample data check:**
```bash
docker exec -it mysql mysql -u user -ppassword db -e "
SELECT id, name, description, amount, category_id, user_id, date
FROM expenses
ORDER BY date DESC
LIMIT 10;
"
```

**Verify soft deletes:**
```bash
docker exec -it mysql mysql -u user -ppassword db -e "
SELECT COUNT(*) as soft_deleted
FROM expenses
WHERE deleted_at IS NOT NULL;
"
```

**Expected:** `soft_deleted: 0` (all migrated expenses are active)

### Step 5: Application Verification

1. **Login to application** with a user account
2. **Navigate to expenses page**
3. **Verify:**
   - Expenses are visible
   - Categories are properly linked
   - Expense counts match Supabase
   - Dates are correct
   - Amounts are correct

## Rollback Procedure

If the migration fails or produces incorrect results:

**1. Stop the application** (to prevent users from creating new data)

**2. Restore from backup:**
```bash
# Docker environment
docker exec -i mysql mysql -u user -ppassword db < /backup/supabase_migration_YYYYMMDD_HHMMSS.sql

# Or direct MySQL access
mysql -h localhost -u user -ppassword db < /backup/supabase_migration_YYYYMMDD_HHMMSS.sql
```

**3. Verify restoration:**
```bash
docker exec -it mysql mysql -u user -ppassword db -e "SELECT COUNT(*) FROM expenses;"
```

**4. Restart application**

**5. Review error logs** and fix issues before retrying

## Field Mapping

### Supabase → MySQL

**Expenses:**
```
note          → name           (empty notes get default: "Expense {id}")
note          → description    (same as name for reference)
type          → (not mapped)
amount        → amount         (converted from string to number)
category_id   → category_id    (mapped to MySQL category ID)
user_id       → user_id        (mapped to MySQL user ID by email)
date          → date           (converted to Date object)
is_approved   → is_approved    (defaults to false)
deleted_at    → deleted_at     (set to null for active records)
```

**Categories:**
```
name          → name
description   → description    (defaults to empty string if missing)
```

## Configuration Options Explained

### MIGRATION_CATEGORY_STRATEGY

**SKIP (Recommended):**
- If category already exists in MySQL, use existing MySQL category ID
- No duplicate categories created

**RENAME:**
- If category exists, import with suffix `_imported`
- Creates: "Food" → "Food_imported"

**REPLACE:**
- If category exists, update its description from Supabase
- Overwrites existing category data

### MIGRATION_SKIP_MISSING_USERS

**false (Recommended):**
- Migration halts if any Supabase user is not found in MySQL
- Ensures no expenses are orphaned

**true:**
- Skip expenses for users not found in MySQL
- Use only if you intentionally want to exclude certain users

## Troubleshooting

### Issue: "Missing Supabase configuration"

**Solution:**
```bash
# Verify environment variables are set
docker exec -it expense-tracker-api env | grep SUPABASE
```

### Issue: "Validation failed - missing users"

**Cause:** Supabase users don't exist in MySQL

**Solution:**
1. Check which users are missing (see migration logs)
2. Create those users in MySQL first
3. Retry migration

### Issue: "Transaction rolled back"

**Cause:** Database error during insert

**Solution:**
1. Check error logs for specific error
2. Verify MySQL connection is stable
3. Check disk space on MySQL server
4. Retry migration

### Issue: "Duplicate key error"

**Cause:** Running migration twice without clearing data

**Solution:**
1. Restore from backup
2. OR: Manually delete migrated records
3. Retry migration

## Performance Notes

- **Small datasets (<1000 expenses):** Migration takes ~2-5 seconds
- **Medium datasets (1000-10000 expenses):** Migration takes ~5-30 seconds
- **Large datasets (>10000 expenses):** Migration takes ~30-120 seconds

Batch size can be adjusted via `MIGRATION_BATCH_SIZE` environment variable.

## Post-Migration

1. ✅ Keep Supabase database as backup for 30 days
2. ✅ Monitor application for any issues with migrated data
3. ✅ Document any field mapping quirks discovered
4. ✅ After verification period, optionally archive or delete Supabase project

## Support

For issues or questions about the migration:
1. Check migration logs in container: `docker logs expense-tracker-api`
2. Verify data in MySQL using SQL queries above
3. Review this documentation for troubleshooting steps

## Migration Script Location

The migration can be run from:
```
apps/api/src/migration-supabase/main.ts
```

Via npm script:
```bash
npm run migrate:supabase
```

## Safety Features

✅ **Transaction-based:** All changes in single transaction (automatic rollback on error)
✅ **Dry-run mode:** Test before actual migration
✅ **Validation:** Pre-migration checks for data integrity
✅ **Batch processing:** Handles large datasets efficiently
✅ **Comprehensive logging:** Detailed progress and error reporting
✅ **Skip invalid records:** Migration continues even if some records are invalid
