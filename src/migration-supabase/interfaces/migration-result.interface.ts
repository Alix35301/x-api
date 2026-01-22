export interface MigrationReport {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  categoriesImported: number;
  expensesImported: number;
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  missingUsers: string[];
  duplicateCategories: string[];
  invalidRecords: string[];
  errors: string[];
  warnings: string[];
}

export interface UserMapping {
  supabaseUserId: string;
  email: string;
  mysqlUserId: number;
}

export interface CategoryMapping {
  supabaseCategoryId: string;
  name: string;
  mysqlCategoryId: number;
}
