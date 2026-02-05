import { Injectable, Logger } from '@nestjs/common';
import * as Papa from 'papaparse';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CsvConfigDto } from '../dto/csv-config.dto';
import { ParsedTransaction } from '../interfaces/parsed-transaction.interface';

// Enable custom parse format plugin for dayjs
dayjs.extend(customParseFormat);

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  parseCSV(fileBuffer: Buffer, config: CsvConfigDto): ParsedTransaction[] {
    this.logger.log('Starting CSV parsing...');

    const fileContent = fileBuffer.toString('utf-8');
    const parsedTransactions: ParsedTransaction[] = [];

    // Parse CSV using PapaParse
    const parseResult = Papa.parse(fileContent, {
      delimiter: config.delimiter,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      this.logger.warn(`CSV parsing encountered ${parseResult.errors.length} errors`);
      parseResult.errors.forEach(error => {
        this.logger.warn(`Row ${error.row}: ${error.message}`);
      });
    }

    const rows = parseResult.data as string[][];

    // Skip header rows
    const dataRows = rows.slice(config.skipRows);

    this.logger.log(`Processing ${dataRows.length} data rows...`);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      try {
        const transaction = this.parseRow(row, config, i);
        if (transaction) {
          parsedTransactions.push(transaction);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse row ${i + config.skipRows}: ${error.message}`);
      }
    }

    this.logger.log(`Successfully parsed ${parsedTransactions.length} transactions`);
    return parsedTransactions;
  }

  private parseRow(row: string[], config: CsvConfigDto, rowIndex: number): ParsedTransaction | null {
    const { columnMappings, dateFormat, amountFormat, filters } = config;

    // Extract and clean values from columns
    const dateStr = this.cleanValue(row[columnMappings.date]);
    const description = this.cleanValue(row[columnMappings.description]);
    const amountStr = this.cleanValue(row[columnMappings.amount]);
    const typeStr = columnMappings.type !== undefined ? this.cleanValue(row[columnMappings.type]) : undefined;

    // Apply filters
    if (filters && !this.passesFilters(row, columnMappings, filters)) {
      return null;
    }

    // Validate required fields
    if (!dateStr || !description || !amountStr) {
      this.logger.warn(`Row ${rowIndex}: Missing required fields`);
      return null;
    }

    // Parse date
    const date = this.parseDate(dateStr, dateFormat);
    if (!date || !date.isValid()) {
      this.logger.warn(`Row ${rowIndex}: Invalid date "${dateStr}"`);
      return null;
    }

    // Parse amount
    const amount = this.parseAmount(amountStr, amountFormat);
    if (amount === null || isNaN(amount)) {
      this.logger.warn(`Row ${rowIndex}: Invalid amount "${amountStr}"`);
      return null;
    }

    // Determine transaction type
    let type: 'DEBIT' | 'CREDIT' | undefined;
    if (typeStr) {
      type = typeStr.toUpperCase().includes('CR') || typeStr.toUpperCase().includes('CREDIT') ? 'CREDIT' : 'DEBIT';
    }

    return {
      date: date.toDate(),
      description,
      amount,
      type,
      rawRow: row,
    };
  }

  private parseDate(dateStr: string, format: string): dayjs.Dayjs {
    // Try parsing with the specified format
    let date = dayjs(dateStr, format, true);

    // If that fails, try common date formats
    if (!date.isValid()) {
      const formats = [
        'YYYY-MM-DD',
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'DD-MM-YYYY',
        'MM-DD-YYYY',
        'YYYY/MM/DD',
      ];

      for (const fmt of formats) {
        date = dayjs(dateStr, fmt, true);
        if (date.isValid()) {
          break;
        }
      }
    }

    return date;
  }

  private parseAmount(amountStr: string, amountFormat?: any): number {
    // Remove currency symbols and whitespace
    let cleanAmount = amountStr.replace(/[$€£¥₹,\s]/g, '');

    // Handle negative patterns
    let isNegative = false;

    // Check for parentheses (100) format
    if (cleanAmount.startsWith('(') && cleanAmount.endsWith(')')) {
      isNegative = true;
      cleanAmount = cleanAmount.slice(1, -1);
    }

    // Check for minus sign
    if (cleanAmount.startsWith('-')) {
      isNegative = true;
      cleanAmount = cleanAmount.slice(1);
    }

    // Check for credit indicator
    if (amountFormat?.creditIndicator && amountStr.includes(amountFormat.creditIndicator)) {
      isNegative = false; // Credit is positive
      cleanAmount = cleanAmount.replace(amountFormat.creditIndicator, '');
    }

    const amount = parseFloat(cleanAmount);
    return isNegative ? -Math.abs(amount) : Math.abs(amount);
  }

  private cleanValue(value: string | undefined): string {
    if (!value) return '';

    let cleaned = value.trim();

    // Handle Excel formula-style text: ="value"
    if (cleaned.startsWith('="') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(2, -1);
    }

    return cleaned;
  }

  private passesFilters(
    row: string[],
    columnMappings: { date: number; description: number; amount: number; type?: number },
    filters: Record<string, { include?: string[]; exclude?: string[] }>,
  ): boolean {
    const columnNameToIndex: Record<string, number | undefined> = {
      date: columnMappings.date,
      description: columnMappings.description,
      amount: columnMappings.amount,
      type: columnMappings.type,
    };

    for (const [columnName, filter] of Object.entries(filters)) {
      const columnIndex = columnNameToIndex[columnName];
      if (columnIndex === undefined) continue;

      const value = this.cleanValue(row[columnIndex]).toUpperCase();

      // Check include filter (if specified, value must match one)
      if (filter.include && filter.include.length > 0) {
        const matches = filter.include.some(v => value.includes(v.toUpperCase()));
        if (!matches) return false;
      }

      // Check exclude filter (if specified, value must not match any)
      if (filter.exclude && filter.exclude.length > 0) {
        const matches = filter.exclude.some(v => value.includes(v.toUpperCase()));
        if (matches) return false;
      }
    }

    return true;
  }
}
