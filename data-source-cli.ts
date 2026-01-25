import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { RefreshTokens } from './src/users/entities/refresh_tokens.entity';
import { Expense } from './src/expense/entities/expense.entity';
import { Category } from './src/category/entities/category.entity';
import { BankAccount } from './src/bank-import/entities/bank-account.entity';
import { ImportHistory } from './src/bank-import/entities/import-history.entity';
import { CategoryRule } from './src/bank-import/entities/category-rule.entity';
import { config } from 'dotenv';

config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : `.env`,
});

console.log(process.env);

export const AppDataSource = new DataSource({
  type: 'mysql' as const,
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'test',
  entities: [User, RefreshTokens, Expense, Category, BankAccount, ImportHistory, CategoryRule],
  migrations: ['src/migrations/*.ts'],
  logging: false,
  extra: {
    connectionLimit: 10,
  },
  connectTimeout: 60000,
});
