import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { BankImportController } from './bank-import.controller';
import { BankImportService } from './bank-import.service';
import { BankAccount } from './entities/bank-account.entity';
import { ImportHistory } from './entities/import-history.entity';
import { CategoryRule } from './entities/category-rule.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Category } from '../category/entities/category.entity';
import { CsvParserService } from './services/csv-parser.service';
import { TransactionValidatorService } from './services/transaction-validator.service';
import { DuplicateDetectorService } from './services/duplicate-detector.service';
import { CategorizationService } from './services/categorization.service';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankAccount,
      ImportHistory,
      CategoryRule,
      Expense,
      Category,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
    }),
    AuthModule,
  ],
  controllers: [BankImportController],
  providers: [
    BankImportService,
    CsvParserService,
    TransactionValidatorService,
    DuplicateDetectorService,
    CategorizationService,
    ImportOrchestratorService,
  ],
  exports: [BankImportService],
})
export class BankImportModule {}
