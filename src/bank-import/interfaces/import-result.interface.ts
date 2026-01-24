export interface ImportReport {
  success: boolean;
  importedCount: number;
  duplicateCount: number;
  totalRows: number;
  warnings: string[];
  errors?: string[];
  importId?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  invalidRecords: number[];
}

export interface DuplicateCheckResult {
  newTransactions: any[];
  duplicates: any[];
}
