import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Category } from '../category/entities/category.entity';
import { BankAccount } from '../bank-import/entities/bank-account.entity';
import { ImportHistory } from '../bank-import/entities/import-history.entity';
import { CategoryRule } from '../bank-import/entities/category-rule.entity';
import { DataSourceOptions } from 'typeorm';

config();

export const getDbConfig = (): DataSourceOptions => {
  return {
    type: 'mysql' as const,
    host: process.env.MYSQL_HOST || 'mysql',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USER || 'user',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'testing',
    entities: [User, RefreshTokens, Expense, Category, BankAccount, ImportHistory, CategoryRule],
    logging: true,
    extra: {
      connectionLimit: 10,
    },
    connectTimeout: 60000,
  }
}

