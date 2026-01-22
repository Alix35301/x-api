import { Module } from '@nestjs/common';
import { SeedService } from './seed/seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Category } from '../category/entities/category.entity';
import { DatabaseService } from '../../src/database/database.service';
import { getDbConfig } from '../../src/configs/database';

@Module({
  providers: [SeedService, DatabaseService],
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDbConfig(),
    }),
    TypeOrmModule.forFeature([User, Category, Expense]),
  ],
})
export class SeedModule { }
