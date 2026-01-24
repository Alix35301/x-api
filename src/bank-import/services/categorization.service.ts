import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { CategoryRule } from '../entities/category-rule.entity';
import { ParsedTransaction } from '../interfaces/parsed-transaction.interface';

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);

  constructor(
    @InjectRepository(CategoryRule)
    private categoryRuleRepository: Repository<CategoryRule>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async categorizeTransaction(
    description: string,
    userId: string,
  ): Promise<Category | null> {
    // Load all active rules for this user (ordered by priority DESC)
    const rules = await this.categoryRuleRepository.find({
      where: { user_id: userId, is_active: true },
      order: { priority: 'DESC' },
      relations: ['category'],
    });

    const normalizedDescription = description.toLowerCase();

    // Check each rule in priority order
    for (const rule of rules) {
      const normalizedPattern = rule.pattern.toLowerCase();

      if (normalizedDescription.includes(normalizedPattern)) {
        this.logger.debug(
          `Matched "${description}" to category "${rule.category.name}" using pattern "${rule.pattern}"`,
        );

        // Increment match count (fire and forget)
        this.categoryRuleRepository
          .increment({ id: rule.id }, 'match_count', 1)
          .catch(err => this.logger.warn(`Failed to increment match count: ${err.message}`));

        return rule.category;
      }
    }

    return null;
  }

  async categorizeBatch(
    transactions: ParsedTransaction[],
    userId: string,
  ): Promise<Map<ParsedTransaction, Category>> {
    this.logger.log(`Categorizing ${transactions.length} transactions...`);

    const categoryMap = new Map<ParsedTransaction, Category>();

    // Load all active rules once (optimization)
    const rules = await this.categoryRuleRepository.find({
      where: { user_id: userId, is_active: true },
      order: { priority: 'DESC' },
      relations: ['category'],
    });

    this.logger.log(`Loaded ${rules.length} active category rules`);

    // Get or create uncategorized category
    const uncategorizedCategory = await this.createOrGetUncategorizedCategory(userId);

    let categorizedCount = 0;

    for (const transaction of transactions) {
      const normalizedDescription = transaction.description.toLowerCase();
      let matched = false;

      // Check each rule in priority order
      for (const rule of rules) {
        const normalizedPattern = rule.pattern.toLowerCase();

        if (normalizedDescription.includes(normalizedPattern)) {
          categoryMap.set(transaction, rule.category);
          matched = true;
          categorizedCount++;

          // Increment match count (fire and forget)
          this.categoryRuleRepository
            .increment({ id: rule.id }, 'match_count', 1)
            .catch(err => this.logger.warn(`Failed to increment match count: ${err.message}`));

          break; // First match wins
        }
      }

      // If no match, assign uncategorized
      if (!matched) {
        categoryMap.set(transaction, uncategorizedCategory);
      }
    }

    this.logger.log(
      `Categorization complete: ${categorizedCount} matched, ${transactions.length - categorizedCount} uncategorized`,
    );

    return categoryMap;
  }

  async createOrGetUncategorizedCategory(userId: string): Promise<Category> {
    // Try to find existing uncategorized category
    let uncategorized = await this.categoryRepository.findOne({
      where: { name: 'Uncategorized' },
    });

    // Create if doesn't exist
    if (!uncategorized) {
      uncategorized = this.categoryRepository.create({
        name: 'Uncategorized',
        description: 'Transactions that need manual categorization',
      });
      uncategorized = await this.categoryRepository.save(uncategorized);
      this.logger.log(`Created "Uncategorized" category with ID ${uncategorized.id}`);
    }

    return uncategorized;
  }
}
