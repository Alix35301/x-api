import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Expense } from '../../expense/entities/expense.entity';
import {
  SupabaseCategory,
  SupabaseExpense,
  MigrationOptions,
} from '../interfaces/supabase-types.interface';
import { UserMapping, CategoryMapping } from '../interfaces/migration-result.interface';

@Injectable()
export class DataMapperService {
  private readonly logger = new Logger(DataMapperService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) { }

  async buildUserMapping(
    supabaseUserEmailMap: Map<string, string>,
  ): Promise<Map<string, number>> {
    this.logger.log('Building user mapping from Supabase UUID to MySQL user ID...');

    const userMapping = new Map<string, number>();
    const emails = Array.from(supabaseUserEmailMap.values());

    // Fetch all users by email
    const mysqlUsers = emails.length > 0
      ? await this.userRepository
        .createQueryBuilder('user')
        .where('user.email IN (:...emails)', { emails })
        .getMany()
      : [];

    // Build email to MySQL user ID map
    const emailToMysqlId = new Map<string, number>();
    for (const user of mysqlUsers) {
      emailToMysqlId.set(user.email, user.id);
    }

    // Build Supabase UUID to MySQL user ID map
    const entries = Array.from(supabaseUserEmailMap.entries());
    for (const [supabaseUserId, email] of entries) {
      const mysqlUserId = emailToMysqlId.get(email);
      if (mysqlUserId) {
        userMapping.set(supabaseUserId, mysqlUserId);
      }
    }

    this.logger.log(`Successfully mapped ${userMapping.size} users`);
    return userMapping;
  }

  async buildCategoryMapping(
    supabaseCategories: SupabaseCategory[],
    categoryStrategy: 'SKIP' | 'RENAME' | 'REPLACE',
  ): Promise<Map<string, number>> {
    this.logger.log('Building category mapping from Supabase to MySQL...');

    const categoryMapping = new Map<string, number>();

    for (const supabaseCategory of supabaseCategories) {
      // Check if category already exists in MySQL
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: supabaseCategory.name },
      });

      if (existingCategory) {
        this.logger.warn(
          `Category "${supabaseCategory.name}" already exists in MySQL with ID ${existingCategory.id}`,
        );

        switch (categoryStrategy) {
          case 'SKIP':
            categoryMapping.set(supabaseCategory.id, existingCategory.id);
            this.logger.log(`Using existing category ID ${existingCategory.id} for "${supabaseCategory.name}"`);
            break;

          case 'RENAME':
            const newName = `${supabaseCategory.name}_imported`;
            const newCategory = this.categoryRepository.create({
              name: newName,
              description: supabaseCategory.description || '',
            });
            const savedNewCategory = await this.categoryRepository.save(newCategory);
            categoryMapping.set(supabaseCategory.id, savedNewCategory.id);
            this.logger.log(`Created renamed category "${newName}" with ID ${savedNewCategory.id}`);
            break;

          case 'REPLACE':
            existingCategory.description = supabaseCategory.description || '';
            await this.categoryRepository.save(existingCategory);
            categoryMapping.set(supabaseCategory.id, existingCategory.id);
            this.logger.log(`Updated existing category "${supabaseCategory.name}" with ID ${existingCategory.id}`);
            break;
        }
      } else {
        // Create new category
        const newCategory = this.categoryRepository.create({
          name: supabaseCategory.name,
          description: supabaseCategory.description || '',
        });
        const savedCategory = await this.categoryRepository.save(newCategory);
        categoryMapping.set(supabaseCategory.id, savedCategory.id);
        this.logger.log(`Created new category "${supabaseCategory.name}" with ID ${savedCategory.id}`);
      }
    }

    this.logger.log(`Successfully mapped ${categoryMapping.size} categories`);
    return categoryMapping;
  }

  transformExpenses(
    supabaseExpenses: SupabaseExpense[],
    userMapping: Map<string, number>,
    categoryMapping: Map<string, number>,
  ): Partial<Expense>[] {
    this.logger.log('Transforming expenses from Supabase to MySQL format...');

    const transformedExpenses: Partial<Expense>[] = [];

    for (const supabaseExpense of supabaseExpenses) {
      // Skip expenses with missing critical fields
      if (!supabaseExpense.category_id || !supabaseExpense.user_id ||
        !supabaseExpense.amount || supabaseExpense.amount === '') {
        this.logger.warn(
          `Skipping expense "${supabaseExpense.note || supabaseExpense.id}" - missing required fields`,
        );
        continue;
      }

      // Parse amount from string to number
      const amountNum = parseFloat(supabaseExpense.amount);
      if (isNaN(amountNum)) {
        this.logger.warn(
          `Skipping expense "${supabaseExpense.note || supabaseExpense.id}" - invalid amount: ${supabaseExpense.amount}`,
        );
        continue;
      }

      const mysqlUserId = userMapping.get(supabaseExpense.user_id);
      const mysqlCategoryId = categoryMapping.get(supabaseExpense.category_id);

      if (!mysqlUserId) {
        this.logger.warn(
          `Skipping expense "${supabaseExpense.note || supabaseExpense.id}" - user ${supabaseExpense.user_id} not found in mapping`,
        );
        continue;
      }

      if (!mysqlCategoryId) {
        this.logger.warn(
          `Skipping expense "${supabaseExpense.note || supabaseExpense.id}" - category ${supabaseExpense.category_id} not found in mapping`,
        );
        continue;
      }

      const transformedExpense: Partial<Expense> = {
        name: supabaseExpense.note || `Expense ${supabaseExpense.id.substring(0, 8)}`,
        description: supabaseExpense.note || '',
        amount: amountNum,
        category_id: mysqlCategoryId.toString(),
        user_id: mysqlUserId.toString(),
        date: new Date(supabaseExpense.date),
        is_approved: false,
        deleted_at: null,
      };

      transformedExpenses.push(transformedExpense);
    }

    this.logger.log(`Successfully transformed ${transformedExpenses.length} expenses`);
    return transformedExpenses;
  }
}
