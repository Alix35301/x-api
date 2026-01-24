export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type?: 'DEBIT' | 'CREDIT'; // Optional: some banks provide this
  rawRow?: Record<string, any>; // Original CSV row for debugging
}
