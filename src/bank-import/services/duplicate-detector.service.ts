import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Expense } from '../../expense/entities/expense.entity';
import { ParsedTransaction } from '../interfaces/parsed-transaction.interface';
import { DuplicateCheckResult } from '../interfaces/import-result.interface';

@Injectable()
export class DuplicateDetectorService {
  private readonly logger = new Logger(DuplicateDetectorService.name);

  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  generateFileHash(fileBuffer: Buffer): string {
    const hash = createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  generateTransactionHash(transaction: ParsedTransaction): string {
    // Normalize fields before hashing
    const normalized = {
      date: transaction.date.toISOString().split('T')[0], // YYYY-MM-DD
      amount: Math.abs(transaction.amount).toFixed(2), // Absolute value, 2 decimals
      description: transaction.description
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '), // Normalize whitespace
    };

    const hashInput = `${normalized.date}|${normalized.amount}|${normalized.description}`;
    const hash = createHash('sha256');
    hash.update(hashInput);
    return hash.digest('hex');
  }

  async checkDuplicates(
    transactions: ParsedTransaction[],
    userId: string,
  ): Promise<DuplicateCheckResult> {
    this.logger.log(`Checking for duplicates among ${transactions.length} transactions...`);

    // Generate hashes for all transactions
    const transactionHashes = transactions.map(tx => ({
      transaction: tx,
      hash: this.generateTransactionHash(tx),
    }));

    const hashes = transactionHashes.map(th => th.hash);

    // Query existing transaction hashes for this user
    const existingExpenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .select(['expense.transaction_hash'])
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.transaction_hash IN (:...hashes)', { hashes })
      .getMany();

    const existingHashSet = new Set(
      existingExpenses.map(e => e.transaction_hash).filter(h => h !== null),
    );

    // Separate new transactions from duplicates
    const newTransactions: ParsedTransaction[] = [];
    const duplicates: ParsedTransaction[] = [];

    for (const { transaction, hash } of transactionHashes) {
      if (existingHashSet.has(hash)) {
        duplicates.push(transaction);
      } else {
        newTransactions.push(transaction);
      }
    }

    this.logger.log(`Found ${newTransactions.length} new transactions and ${duplicates.length} duplicates`);

    return {
      newTransactions,
      duplicates,
    };
  }

  async checkDuplicatesWithHashes(
    transactionsWithHashes: Array<{ transaction: ParsedTransaction; hash: string }>,
    userId: string,
  ): Promise<DuplicateCheckResult> {
    this.logger.log(`Checking for duplicates among ${transactionsWithHashes.length} transactions...`);

    const hashes = transactionsWithHashes.map(th => th.hash);

    // Query existing transaction hashes for this user
    const existingExpenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .select(['expense.transaction_hash'])
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.transaction_hash IN (:...hashes)', { hashes })
      .getMany();

    const existingHashSet = new Set(
      existingExpenses.map(e => e.transaction_hash).filter(h => h !== null),
    );

    // Separate new transactions from duplicates
    const newTransactions: ParsedTransaction[] = [];
    const duplicates: ParsedTransaction[] = [];

    for (const { transaction, hash } of transactionsWithHashes) {
      if (existingHashSet.has(hash)) {
        duplicates.push(transaction);
      } else {
        newTransactions.push(transaction);
      }
    }

    this.logger.log(`Found ${newTransactions.length} new transactions and ${duplicates.length} duplicates`);

    return {
      newTransactions,
      duplicates,
    };
  }
}
