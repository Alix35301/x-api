export interface SupabaseExpense {
  id: string;
  note: string;
  amount: string; // Supabase stores as string
  category_id: string;
  user_id: string;
  date: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
}

export interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  categoryStrategy: 'SKIP' | 'RENAME' | 'REPLACE';
  skipMissingUsers: boolean;
}
