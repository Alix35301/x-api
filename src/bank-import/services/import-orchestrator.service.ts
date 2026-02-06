import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BankAccount } from '../entities/bank-account.entity';
import { ImportHistory, ImportStatus } from '../entities/import-history.entity';
import { Expense, ExpenseSource } from '../../expense/entities/expense.entity';
import { CsvParserService } from './csv-parser.service';
import { TransactionValidatorService } from './transaction-validator.service';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { CategorizationService } from './categorization.service';
import { ImportReport } from '../interfaces/import-result.interface';
import { ParsedTransaction } from '../interfaces/parsed-transaction.interface';

@Injectable()
export class ImportOrchestratorService {
  private readonly logger = new Logger(ImportOrchestratorService.name);

  constructor(
    private readonly csvParser: CsvParserService,
    private readonly validator: TransactionValidatorService,
    private readonly duplicateDetector: DuplicateDetectorService,
    private readonly categorization: CategorizationService,
    private readonly dataSource: DataSource,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(ImportHistory)
    private importHistoryRepository: Repository<ImportHistory>,
  ) {}

  async importStatement(
    file: Buffer,
    userId: string,
    accountId: number,
    fileName: string,
  ): Promise<ImportReport> {
    const startTime = new Date();

    this.logger.log('=== Starting Bank Statement Import ===');
    this.logger.log(`User ID: ${userId}`);
    this.logger.log(`Account ID: ${accountId}`);
    this.logger.log(`File Name: ${fileName}`);
    this.logger.log('======================================');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const report: ImportReport = {
      success: false,
      importedCount: 0,
      duplicateCount: 0,
      totalRows: 0,
      warnings: [],
      errors: [],
    };

    try {
      // Phase 1: Load account config
      this.logger.log('Phase 1: Loading bank account configuration...');
      const account = await this.findBankAccount(accountId, userId);
      const csvConfig = account.csv_config;

      // Phase 2: Parse CSV
      this.logger.log('Phase 2: Parsing CSV file...');
      const parsedTransactions = this.csvParser.parseCSV(file, csvConfig);
      report.totalRows = parsedTransactions.length;

      if (parsedTransactions.length === 0) {
        throw new Error('No valid transactions found in CSV file');
      }

      // Phase 3: Validate data
      this.logger.log('Phase 3: Validating transaction data...');
      const validationResult = this.validator.validate(parsedTransactions, account.account_type);
      report.warnings = validationResult.warnings;

      if (!validationResult.valid) {
        report.errors = validationResult.errors;
        throw new Error(`Validation failed with ${validationResult.errors.length} errors`);
      }

      // Filter out invalid transactions
      const validTransactions = parsedTransactions.filter(
        (_, index) => !validationResult.invalidRecords.includes(index),
      );

      // Filter out own-account transfers (e.g., transfers to/from ALI HASSAN)
      const ownAccountPatterns = ['ALI HASSAN'];
      const filteredTransactions = validTransactions.filter(tx => {
        const descriptionUpper = tx.description.toUpperCase();
        const isOwnTransfer = ownAccountPatterns.some(pattern => descriptionUpper.includes(pattern));
        if (isOwnTransfer) {
          report.warnings.push(`Skipped own-account transfer: ${tx.description}`);
        }
        return !isOwnTransfer;
      });

      const skippedOwnTransfers = validTransactions.length - filteredTransactions.length;
      if (skippedOwnTransfers > 0) {
        this.logger.log(`Filtered out ${skippedOwnTransfers} own-account transfers`);
      }

      this.logger.log(`Valid transactions: ${filteredTransactions.length}/${parsedTransactions.length}`);

      // Phase 4: Check duplicates
      this.logger.log('Phase 4: Checking for duplicates...');
      const fileHash = this.duplicateDetector.generateFileHash(file);

      // Check if this file has already been imported
      const existingImport = await this.importHistoryRepository.findOne({
        where: { file_hash: fileHash, user_id: userId },
      });

      if (existingImport) {
        throw new Error(
          `This file has already been imported on ${existingImport.created_at.toISOString()}`,
        );
      }

      // Check for duplicate transactions
      const { newTransactions, duplicates } = await this.duplicateDetector.checkDuplicates(
        filteredTransactions,
        userId,
      );

      report.duplicateCount = duplicates.length;

      if (newTransactions.length === 0) {
        this.logger.warn('No new transactions to import (all duplicates)');
        report.success = true;
        return report;
      }

      // Phase 5: Auto-categorize
      this.logger.log('Phase 5: Auto-categorizing transactions...');
      const categoryMap = await this.categorization.categorizeBatch(newTransactions, userId);

      // Phase 6: Start transaction & import
      this.logger.log('Phase 6: Starting database transaction...');
      await queryRunner.startTransaction();

      try {
        // Create import history record
        const importRecord = queryRunner.manager.create(ImportHistory, {
          user_id: userId,
          account_id: accountId,
          file_name: fileName,
          file_hash: fileHash,
          total_rows: parsedTransactions.length,
          imported_count: 0,
          duplicate_count: duplicates.length,
          error_count: validationResult.invalidRecords.length,
          status: ImportStatus.SUCCESS,
        });

        const savedImportRecord = await queryRunner.manager.save(ImportHistory, importRecord);

        // Transform to Expense entities
        const expenses = newTransactions.map(tx => {
          const category = categoryMap.get(tx);
          const transactionHash = this.duplicateDetector.generateTransactionHash(tx);

          return queryRunner.manager.create(Expense, {
            user_id: userId,
            name: tx.description.substring(0, 100), // Truncate if needed
            description: tx.description,
            raw_description: tx.description,
            amount: Math.abs(tx.amount), // Store as positive
            category_id: category ? category.id.toString() : '0',
            date: tx.date,
            source: ExpenseSource.IMPORT,
            import_id: savedImportRecord.id,
            transaction_hash: transactionHash,
            is_approved: false, // Require user review
          });
        });

        // Batch insert (size: 500)
        this.logger.log('Phase 7: Inserting expenses in batches...');
        const batchSize = 500;
        let importedCount = 0;

        for (let i = 0; i < expenses.length; i += batchSize) {
          const batch = expenses.slice(i, i + batchSize);
          const batchNumber = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(expenses.length / batchSize);

          this.logger.log(`Inserting batch ${batchNumber}/${totalBatches} (${batch.length} expenses)...`);

          await queryRunner.manager.save(Expense, batch);
          importedCount += batch.length;

          this.logger.log(`Progress: ${importedCount}/${expenses.length} expenses inserted`);
        }

        // Update import record with final counts
        await queryRunner.manager.update(ImportHistory, savedImportRecord.id, {
          imported_count: importedCount,
        });

        report.importedCount = importedCount;

        // Commit transaction
        await queryRunner.commitTransaction();
        this.logger.log('Transaction committed successfully');

        report.success = true;
        report.importId = savedImportRecord.id;
      } catch (error) {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        this.logger.error('Transaction rolled back due to error', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('Import failed', error);
      report.success = false;
      if (!report.errors) {
        report.errors = [];
      }
      report.errors.push(error.message);
    } finally {
      await queryRunner.release();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logImportSummary(report, duration);
    }

    return report;
  }

  private async findBankAccount(accountId: number, userId: string): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId, user_id: userId },
    });

    if (!account) {
      throw new NotFoundException(
        `Bank account with ID ${accountId} not found or does not belong to user`,
      );
    }

    if (!account.is_active) {
      throw new Error(`Bank account "${account.account_name}" is inactive`);
    }

    return account;
  }

  private logImportSummary(report: ImportReport, duration: number): void {
    this.logger.log('=== Import Summary ===');
    this.logger.log(`Success: ${report.success}`);
    this.logger.log(`Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    this.logger.log(`Total Rows: ${report.totalRows}`);
    this.logger.log(`Imported: ${report.importedCount}`);
    this.logger.log(`Duplicates: ${report.duplicateCount}`);
    this.logger.log(`Warnings: ${report.warnings.length}`);
    this.logger.log(`Errors: ${report.errors?.length || 0}`);

    if (report.errors && report.errors.length > 0) {
      this.logger.error('Errors:', report.errors);
    }

    if (report.warnings.length > 0) {
      this.logger.warn(`Warnings (${report.warnings.length} total):`);
      report.warnings.slice(0, 10).forEach(warning => this.logger.warn(`- ${warning}`));
      if (report.warnings.length > 10) {
        this.logger.warn(`... and ${report.warnings.length - 10} more warnings`);
      }
    }

    this.logger.log('====================');
  }
}
