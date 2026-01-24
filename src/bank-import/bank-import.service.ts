import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { ImportHistory } from './entities/import-history.entity';
import { CategoryRule } from './entities/category-rule.entity';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateCategoryRuleDto, UpdateCategoryRuleDto } from './dto/create-category-rule.dto';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { ImportReport } from './interfaces/import-result.interface';

@Injectable()
export class BankImportService {
  private readonly logger = new Logger(BankImportService.name);

  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(ImportHistory)
    private importHistoryRepository: Repository<ImportHistory>,
    @InjectRepository(CategoryRule)
    private categoryRuleRepository: Repository<CategoryRule>,
    private readonly importOrchestrator: ImportOrchestratorService,
  ) {}

  // ==================== Bank Account Management ====================

  async createBankAccount(
    userId: string,
    dto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    this.logger.log(`Creating bank account for user ${userId}`);

    const account = this.bankAccountRepository.create({
      user_id: userId,
      bank_name: dto.bankName,
      account_name: dto.accountName,
      account_number_last4: dto.accountNumberLast4,
      account_type: dto.accountType,
      csv_config: dto.csvConfig,
      is_active: dto.isActive !== undefined ? dto.isActive : true,
    });

    return await this.bankAccountRepository.save(account);
  }

  async findAllBankAccounts(userId: string): Promise<BankAccount[]> {
    return await this.bankAccountRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOneBankAccount(userId: string, id: number): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!account) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }

    return account;
  }

  async updateBankAccount(
    userId: string,
    id: number,
    dto: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    const account = await this.findOneBankAccount(userId, id);

    if (dto.bankName !== undefined) account.bank_name = dto.bankName;
    if (dto.accountName !== undefined) account.account_name = dto.accountName;
    if (dto.accountNumberLast4 !== undefined) account.account_number_last4 = dto.accountNumberLast4;
    if (dto.accountType !== undefined) account.account_type = dto.accountType;
    if (dto.csvConfig !== undefined) account.csv_config = dto.csvConfig;
    if (dto.isActive !== undefined) account.is_active = dto.isActive;

    return await this.bankAccountRepository.save(account);
  }

  async deleteBankAccount(userId: string, id: number): Promise<void> {
    const account = await this.findOneBankAccount(userId, id);
    await this.bankAccountRepository.remove(account);
  }

  // ==================== Category Rules Management ====================

  async createCategoryRule(
    userId: string,
    dto: CreateCategoryRuleDto,
  ): Promise<CategoryRule> {
    this.logger.log(`Creating category rule for user ${userId}`);

    const rule = this.categoryRuleRepository.create({
      user_id: userId,
      pattern: dto.pattern,
      category_id: dto.categoryId,
      priority: dto.priority !== undefined ? dto.priority : 0,
      is_active: dto.isActive !== undefined ? dto.isActive : true,
    });

    return await this.categoryRuleRepository.save(rule);
  }

  async findAllCategoryRules(userId: string): Promise<CategoryRule[]> {
    return await this.categoryRuleRepository.find({
      where: { user_id: userId },
      order: { priority: 'DESC', created_at: 'DESC' },
      relations: ['category'],
    });
  }

  async findOneCategoryRule(userId: string, id: number): Promise<CategoryRule> {
    const rule = await this.categoryRuleRepository.findOne({
      where: { id, user_id: userId },
      relations: ['category'],
    });

    if (!rule) {
      throw new NotFoundException(`Category rule with ID ${id} not found`);
    }

    return rule;
  }

  async updateCategoryRule(
    userId: string,
    id: number,
    dto: UpdateCategoryRuleDto,
  ): Promise<CategoryRule> {
    const rule = await this.findOneCategoryRule(userId, id);

    if (dto.pattern !== undefined) rule.pattern = dto.pattern;
    if (dto.categoryId !== undefined) rule.category_id = dto.categoryId;
    if (dto.priority !== undefined) rule.priority = dto.priority;
    if (dto.isActive !== undefined) rule.is_active = dto.isActive;

    return await this.categoryRuleRepository.save(rule);
  }

  async deleteCategoryRule(userId: string, id: number): Promise<void> {
    const rule = await this.findOneCategoryRule(userId, id);
    await this.categoryRuleRepository.remove(rule);
  }

  // ==================== Import History ====================

  async findAllImports(userId: string, limit = 50): Promise<ImportHistory[]> {
    return await this.importHistoryRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['account'],
    });
  }

  async findOneImport(userId: string, id: number): Promise<ImportHistory> {
    const importRecord = await this.importHistoryRepository.findOne({
      where: { id, user_id: userId },
      relations: ['account'],
    });

    if (!importRecord) {
      throw new NotFoundException(`Import record with ID ${id} not found`);
    }

    return importRecord;
  }

  // ==================== Statement Import ====================

  async importStatement(
    userId: string,
    accountId: number,
    file: Buffer,
    fileName: string,
  ): Promise<ImportReport> {
    return await this.importOrchestrator.importStatement(
      file,
      userId,
      accountId,
      fileName,
    );
  }
}
