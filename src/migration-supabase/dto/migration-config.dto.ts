import { MigrationOptions } from '../interfaces/supabase-types.interface';

export class MigrationConfigDto implements MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  categoryStrategy: 'SKIP' | 'RENAME' | 'REPLACE';
  skipMissingUsers: boolean;

  constructor() {
    this.dryRun = process.env.MIGRATION_DRY_RUN === 'true';
    this.batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE || '500', 10);
    this.categoryStrategy = (process.env.MIGRATION_CATEGORY_STRATEGY || 'SKIP') as 'SKIP' | 'RENAME' | 'REPLACE';
    this.skipMissingUsers = process.env.MIGRATION_SKIP_MISSING_USERS === 'true';
  }
}
