import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import {
  SupabaseCategory,
  SupabaseExpense,
} from '../interfaces/supabase-types.interface';
import { ValidationResult } from '../interfaces/migration-result.interface';

@Injectable()
export class MigrationValidatorService {
  private readonly logger = new Logger(MigrationValidatorService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async validateMigration(
    supabaseExpenses: SupabaseExpense[],
    supabaseCategories: SupabaseCategory[],
    supabaseUserEmailMap: Map<string, string>,
  ): Promise<ValidationResult> {
    this.logger.log('Starting migration validation...');

    const validationResult: ValidationResult = {
      valid: true,
      missingUsers: [],
      duplicateCategories: [],
      invalidRecords: [],
      errors: [],
      warnings: [],
    };

    // Validate users
    await this.validateUsers(supabaseUserEmailMap, validationResult);

    // Validate categories
    await this.validateCategories(supabaseCategories, validationResult);

    // Validate data integrity
    this.validateData(supabaseExpenses, supabaseCategories, validationResult);

    // Determine overall validity
    validationResult.valid = validationResult.errors.length === 0;

    this.logger.log('Validation complete');
    this.logValidationSummary(validationResult);

    return validationResult;
  }

  private async validateUsers(
    supabaseUserEmailMap: Map<string, string>,
    validationResult: ValidationResult,
  ): Promise<void> {
    this.logger.log(`Validating ${supabaseUserEmailMap.size} users...`);

    const emails = Array.from(supabaseUserEmailMap.values());
    const mysqlUsers = emails.length > 0
      ? await this.userRepository
          .createQueryBuilder('user')
          .where('user.email IN (:...emails)', { emails })
          .getMany()
      : [];

    const mysqlEmails = new Set(mysqlUsers.map((user) => user.email));

    const entries = Array.from(supabaseUserEmailMap.entries());
    for (const [supabaseUserId, email] of entries) {
      if (!mysqlEmails.has(email)) {
        validationResult.missingUsers.push(email);
        validationResult.warnings.push(`User with email "${email}" (Supabase ID: ${supabaseUserId}) not found in MySQL`);
      }
    }

    if (validationResult.missingUsers.length > 0) {
      this.logger.warn(`Found ${validationResult.missingUsers.length} missing users in MySQL`);
    } else {
      this.logger.log('All users found in MySQL');
    }
  }

  private async validateCategories(
    supabaseCategories: SupabaseCategory[],
    validationResult: ValidationResult,
  ): Promise<void> {
    this.logger.log(`Validating ${supabaseCategories.length} categories...`);

    for (const supabaseCategory of supabaseCategories) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: supabaseCategory.name },
      });

      if (existingCategory) {
        validationResult.duplicateCategories.push(supabaseCategory.name);
        validationResult.warnings.push(
          `Category "${supabaseCategory.name}" already exists in MySQL (ID: ${existingCategory.id})`,
        );
      }
    }

    if (validationResult.duplicateCategories.length > 0) {
      this.logger.warn(`Found ${validationResult.duplicateCategories.length} duplicate categories in MySQL`);
    } else {
      this.logger.log('No duplicate categories found');
    }
  }

  private validateData(
    supabaseExpenses: SupabaseExpense[],
    supabaseCategories: SupabaseCategory[],
    validationResult: ValidationResult,
  ): void {
    this.logger.log('Validating data integrity...');

    // Validate expenses have required fields
    for (const expense of supabaseExpenses) {
      const missingFields: string[] = [];

      if (!expense.category_id) missingFields.push('category_id');
      if (!expense.user_id) missingFields.push('user_id');
      if (expense.amount === null || expense.amount === undefined || expense.amount === '') missingFields.push('amount');

      if (missingFields.length > 0) {
        const message = `Expense "${expense.note || expense.id}" (ID: ${expense.id}) is missing fields: ${missingFields.join(', ')}`;
        validationResult.invalidRecords.push(message);
        validationResult.warnings.push(message);
        this.logger.warn(message);
      }

      // Validate amount is a valid number
      const amountNum = parseFloat(expense.amount);
      if (expense.amount && (isNaN(amountNum) || amountNum < 0)) {
        validationResult.warnings.push(
          `Expense "${expense.note || expense.id}" has invalid amount: ${expense.amount}`,
        );
      }
    }

    // Validate categories have required fields
    for (const category of supabaseCategories) {
      const missingFields: string[] = [];

      if (!category.name) missingFields.push('name');

      if (missingFields.length > 0) {
        const message = `Category "${category.name || category.id}" (ID: ${category.id}) is missing fields: ${missingFields.join(', ')}`;
        validationResult.invalidRecords.push(message);
        validationResult.warnings.push(message);
        this.logger.warn(message);
      }
    }

    if (validationResult.invalidRecords.length > 0) {
      this.logger.warn(`Found ${validationResult.invalidRecords.length} invalid records`);
    } else {
      this.logger.log('All records have valid data');
    }
  }

  private logValidationSummary(validationResult: ValidationResult): void {
    this.logger.log('=== Validation Summary ===');
    this.logger.log(`Valid: ${validationResult.valid}`);
    this.logger.log(`Missing Users: ${validationResult.missingUsers.length}`);
    this.logger.log(`Duplicate Categories: ${validationResult.duplicateCategories.length}`);
    this.logger.log(`Invalid Records: ${validationResult.invalidRecords.length}`);
    this.logger.log(`Errors: ${validationResult.errors.length}`);
    this.logger.log(`Warnings: ${validationResult.warnings.length}`);
    this.logger.log('=======================');
  }
}
