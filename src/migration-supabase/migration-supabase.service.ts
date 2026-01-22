import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Expense } from '../expense/entities/expense.entity';
import { Category } from '../category/entities/category.entity';
import { SupabaseExtractorService } from './services/supabase-extractor.service';
import { DataMapperService } from './services/data-mapper.service';
import { MigrationValidatorService } from './services/migration-validator.service';
import { MigrationConfigDto } from './dto/migration-config.dto';
import { MigrationReport } from './interfaces/migration-result.interface';

@Injectable()
export class MigrationSupabaseService {
  private readonly logger = new Logger(MigrationSupabaseService.name);

  constructor(
    private readonly supabaseExtractor: SupabaseExtractorService,
    private readonly dataMapper: DataMapperService,
    private readonly validator: MigrationValidatorService,
    private readonly dataSource: DataSource,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async migrate(): Promise<MigrationReport> {
    const config = new MigrationConfigDto();
    const startTime = new Date();

    this.logger.log('=== Starting Supabase to MySQL Migration ===');
    this.logger.log(`Dry Run: ${config.dryRun}`);
    this.logger.log(`Batch Size: ${config.batchSize}`);
    this.logger.log(`Category Strategy: ${config.categoryStrategy}`);
    this.logger.log(`Skip Missing Users: ${config.skipMissingUsers}`);
    this.logger.log('========================================');

    const report: MigrationReport = {
      success: false,
      startTime,
      endTime: new Date(),
      duration: 0,
      categoriesImported: 0,
      expensesImported: 0,
      errors: [],
      warnings: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Phase 1: Extract data from Supabase
      this.logger.log('Phase 1: Extracting data from Supabase...');
      const supabaseCategories = await this.supabaseExtractor.extractCategories();
      const supabaseExpenses = await this.supabaseExtractor.extractExpenses();

      // Get unique user IDs from expenses
      const uniqueUserIds = Array.from(
        new Set(supabaseExpenses.map((expense) => expense.user_id)),
      );

      // Fetch user emails from Supabase
      const supabaseUserEmailMap = await this.supabaseExtractor.getUserEmailMap(uniqueUserIds);

      // Phase 2: Validate data
      this.logger.log('Phase 2: Validating data...');
      const validationResult = await this.validator.validateMigration(
        supabaseExpenses,
        supabaseCategories,
        supabaseUserEmailMap,
      );

      report.warnings = validationResult.warnings;

      if (!validationResult.valid) {
        report.errors = validationResult.errors;
        throw new Error('Validation failed. Please check the errors above.');
      }

      if (validationResult.missingUsers.length > 0 && !config.skipMissingUsers) {
        throw new Error(
          `Found ${validationResult.missingUsers.length} missing users. Set MIGRATION_SKIP_MISSING_USERS=true to skip their expenses.`,
        );
      }

      if (config.dryRun) {
        this.logger.log('=== DRY RUN MODE ===');
        this.logger.log(`Total categories in Supabase: ${supabaseCategories.length}`);
        this.logger.log(`Total expenses in Supabase: ${supabaseExpenses.length}`);
        this.logger.log(`Invalid records (will be skipped): ${validationResult.invalidRecords.length}`);
        this.logger.log(`Missing users: ${validationResult.missingUsers.length}`);
        this.logger.log(`Duplicate categories: ${validationResult.duplicateCategories.length}`);
        this.logger.log(`Category strategy: ${config.categoryStrategy}`);
        this.logger.log('===================');

        report.success = true;
        report.endTime = new Date();
        report.duration = report.endTime.getTime() - startTime.getTime();
        return report;
      }

      // Phase 3: Start transaction
      this.logger.log('Phase 3: Starting transaction...');
      await queryRunner.startTransaction();

      try {
        // Phase 4: Build user mapping
        this.logger.log('Phase 4: Building user mapping...');
        const userMapping = await this.dataMapper.buildUserMapping(supabaseUserEmailMap);

        // Phase 5: Migrate categories and build category mapping
        this.logger.log('Phase 5: Migrating categories...');
        const categoryMapping = await this.dataMapper.buildCategoryMapping(
          supabaseCategories,
          config.categoryStrategy,
        );
        report.categoriesImported = categoryMapping.size;

        // Phase 6: Transform and insert expenses in batches
        this.logger.log('Phase 6: Transforming and inserting expenses...');
        const transformedExpenses = this.dataMapper.transformExpenses(
          supabaseExpenses,
          userMapping,
          categoryMapping,
        );

        const totalBatches = Math.ceil(transformedExpenses.length / config.batchSize);
        let insertedCount = 0;

        for (let i = 0; i < transformedExpenses.length; i += config.batchSize) {
          const batch = transformedExpenses.slice(i, i + config.batchSize);
          const batchNumber = Math.floor(i / config.batchSize) + 1;

          this.logger.log(`Inserting batch ${batchNumber}/${totalBatches} (${batch.length} expenses)...`);

          await queryRunner.manager.save(Expense, batch);
          insertedCount += batch.length;

          this.logger.log(`Progress: ${insertedCount}/${transformedExpenses.length} expenses inserted`);
        }

        report.expensesImported = insertedCount;

        // Commit transaction
        await queryRunner.commitTransaction();
        this.logger.log('Transaction committed successfully');

        report.success = true;
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        this.logger.error('Transaction rolled back due to error', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('Migration failed', error);
      report.success = false;
      report.errors.push(error.message);
    } finally {
      await queryRunner.release();

      report.endTime = new Date();
      report.duration = report.endTime.getTime() - startTime.getTime();

      this.logMigrationSummary(report);
    }

    return report;
  }

  private logMigrationSummary(report: MigrationReport): void {
    this.logger.log('=== Migration Summary ===');
    this.logger.log(`Success: ${report.success}`);
    this.logger.log(`Duration: ${report.duration}ms (${(report.duration / 1000).toFixed(2)}s)`);
    this.logger.log(`Categories Imported: ${report.categoriesImported}`);
    this.logger.log(`Expenses Imported: ${report.expensesImported}`);
    this.logger.log(`Errors: ${report.errors.length}`);
    this.logger.log(`Warnings: ${report.warnings.length}`);

    if (report.errors.length > 0) {
      this.logger.error('Errors:', report.errors);
    }

    if (report.warnings.length > 0) {
      this.logger.warn(`Warnings (${report.warnings.length} total):`);
      report.warnings.slice(0, 10).forEach((warning) => this.logger.warn(`- ${warning}`));
      if (report.warnings.length > 10) {
        this.logger.warn(`... and ${report.warnings.length - 10} more warnings`);
      }
    }

    this.logger.log('=======================');
  }
}
