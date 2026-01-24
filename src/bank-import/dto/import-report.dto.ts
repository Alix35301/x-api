export class ImportReportDto {
  success: boolean;
  importedCount: number;
  duplicateCount: number;
  totalRows: number;
  warnings: string[];
  errors?: string[];
  importId?: number;
}
