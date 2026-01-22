import { NestFactory } from '@nestjs/core';
import { MigrationSupabaseModule } from './migration-supabase.module';
import { MigrationSupabaseService } from './migration-supabase.service';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  console.log(chalk.blue.bold('=== Supabase to MySQL Migration Tool ==='));
  console.log('');

  try {
    // Create NestJS application
    const app = await NestFactory.create(MigrationSupabaseModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Get migration service
    const migrationService = app.get(MigrationSupabaseService);

    // Run migration
    const report = await migrationService.migrate();

    // Close application
    await app.close();

    // Display final result
    console.log('');
    if (report.success) {
      console.log(chalk.green.bold('✓ Migration completed successfully!'));
      console.log('');
      console.log(chalk.green(`Categories imported: ${report.categoriesImported}`));
      console.log(chalk.green(`Expenses imported: ${report.expensesImported}`));
      console.log(chalk.green(`Duration: ${(report.duration / 1000).toFixed(2)}s`));

      if (report.warnings.length > 0) {
        console.log('');
        console.log(chalk.yellow(`⚠ Warnings: ${report.warnings.length}`));
      }

      process.exit(0);
    } else {
      console.log(chalk.red.bold('✗ Migration failed!'));
      console.log('');
      console.log(chalk.red(`Errors: ${report.errors.length}`));

      if (report.errors.length > 0) {
        console.log('');
        console.log(chalk.red('Error details:'));
        report.errors.forEach((error) => {
          console.log(chalk.red(`- ${error}`));
        });
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error(chalk.red.bold('✗ Migration failed with unexpected error!'));
    console.error('');
    console.error(chalk.red(error.message));

    if (error.stack) {
      console.error('');
      console.error(chalk.gray('Stack trace:'));
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}

bootstrap();
