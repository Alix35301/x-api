import { Injectable, Logger } from '@nestjs/common';
import { ParsedTransaction } from '../interfaces/parsed-transaction.interface';
import { ValidationResult } from '../interfaces/import-result.interface';
import { AccountType } from '../entities/bank-account.entity';

@Injectable()
export class TransactionValidatorService {
  private readonly logger = new Logger(TransactionValidatorService.name);

  validate(
    transactions: ParsedTransaction[],
    accountType: AccountType,
  ): ValidationResult {
    this.logger.log(`Validating ${transactions.length} transactions...`);

    const validationResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      invalidRecords: [],
    };

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      this.validateTransaction(transaction, i, accountType, validationResult);
    }

    // Overall validation status
    validationResult.valid = validationResult.errors.length === 0;

    this.logger.log('Validation complete');
    this.logValidationSummary(validationResult);

    return validationResult;
  }

  private validateTransaction(
    transaction: ParsedTransaction,
    index: number,
    accountType: AccountType,
    result: ValidationResult,
  ): void {
    const missingFields: string[] = [];

    // Check required fields
    if (!transaction.date) {
      missingFields.push('date');
    }

    if (!transaction.description || transaction.description.trim() === '') {
      missingFields.push('description');
    }

    if (transaction.amount === null || transaction.amount === undefined) {
      missingFields.push('amount');
    }

    if (missingFields.length > 0) {
      const message = `Transaction ${index + 1}: Missing required fields: ${missingFields.join(', ')}`;
      result.errors.push(message);
      result.invalidRecords.push(index);
      this.logger.error(message);
      return;
    }

    // Validate date is not in the future
    const now = new Date();
    if (transaction.date > now) {
      const message = `Transaction ${index + 1}: Date is in the future (${transaction.date.toISOString()})`;
      result.warnings.push(message);
      this.logger.warn(message);
    }

    // Validate amount is a valid number
    if (isNaN(transaction.amount)) {
      const message = `Transaction ${index + 1}: Invalid amount value`;
      result.errors.push(message);
      result.invalidRecords.push(index);
      this.logger.error(message);
      return;
    }

    // Validate amount is not zero
    if (transaction.amount === 0) {
      const message = `Transaction ${index + 1}: Amount is zero`;
      result.warnings.push(message);
      this.logger.warn(message);
    }

    // Check for suspiciously large amounts
    const absAmount = Math.abs(transaction.amount);
    if (absAmount > 100000) {
      const message = `Transaction ${index + 1}: Large amount detected: ${transaction.amount}`;
      result.warnings.push(message);
      this.logger.warn(message);
    }

    // Validate description is not too short
    if (transaction.description.length < 2) {
      const message = `Transaction ${index + 1}: Description is too short`;
      result.warnings.push(message);
      this.logger.warn(message);
    }

    // Account-type specific validations
    if (accountType === AccountType.CREDIT_CARD) {
      // For credit cards, most transactions should be negative (expenses)
      // Positive amounts are payments to the card
      if (transaction.amount > 0 && absAmount > 1000) {
        const message = `Transaction ${index + 1}: Large positive amount on credit card (payment?)`;
        result.warnings.push(message);
        this.logger.warn(message);
      }
    }
  }

  private logValidationSummary(result: ValidationResult): void {
    this.logger.log('=== Validation Summary ===');
    this.logger.log(`Valid: ${result.valid}`);
    this.logger.log(`Errors: ${result.errors.length}`);
    this.logger.log(`Warnings: ${result.warnings.length}`);
    this.logger.log(`Invalid Records: ${result.invalidRecords.length}`);

    if (result.errors.length > 0) {
      this.logger.error(`First 5 errors:`);
      result.errors.slice(0, 5).forEach(error => this.logger.error(`- ${error}`));
    }

    if (result.warnings.length > 10) {
      this.logger.warn(`${result.warnings.length} warnings found (showing first 5)`);
      result.warnings.slice(0, 5).forEach(warning => this.logger.warn(`- ${warning}`));
    }

    this.logger.log('=======================');
  }
}
