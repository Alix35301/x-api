import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Category } from '../category/entities/category.entity';
import { MigrationSupabaseService } from './migration-supabase.service';
import { SupabaseExtractorService } from './services/supabase-extractor.service';
import { DataMapperService } from './services/data-mapper.service';
import { MigrationValidatorService } from './services/migration-validator.service';
import { getDbConfig } from '../configs/database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDbConfig(),
    }),
    TypeOrmModule.forFeature([User, Category, Expense]),
  ],
  providers: [
    MigrationSupabaseService,
    SupabaseExtractorService,
    DataMapperService,
    MigrationValidatorService,
  ],
  exports: [MigrationSupabaseService],
})
export class MigrationSupabaseModule {}
