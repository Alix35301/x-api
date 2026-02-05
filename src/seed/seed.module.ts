import { Module } from '@nestjs/common';
import { SeedService } from './seed/seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Category } from '../category/entities/category.entity';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';
import { BankAccount } from '../bank-import/entities/bank-account.entity';
import { ImportHistory } from '../bank-import/entities/import-history.entity';
import { CategoryRule } from '../bank-import/entities/category-rule.entity';
import { DatabaseService } from '../database/database.service';
import { getDbConfig } from '../configs/database';

@Module({
  providers: [SeedService, DatabaseService],
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDbConfig(),
    }),
    TypeOrmModule.forFeature([User, Category, Expense, RefreshTokens, BankAccount, ImportHistory, CategoryRule]),
  ],
})
export class SeedModule { }
