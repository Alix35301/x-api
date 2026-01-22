import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCategory, SupabaseExpense, SupabaseUser } from '../interfaces/supabase-types.interface';

@Injectable()
export class SupabaseExtractorService {
  private readonly logger = new Logger(SupabaseExtractorService.name);
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async extractCategories(): Promise<SupabaseCategory[]> {
    this.logger.log('Extracting categories from Supabase...');

    try {
      const { data, error } = await this.supabase
        .from('expense_categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      this.logger.log(`Extracted ${data?.length || 0} categories from Supabase`);
      return data as SupabaseCategory[];
    } catch (error) {
      this.logger.error('Error extracting categories from Supabase', error);
      throw error;
    }
  }

  async extractExpenses(batchSize: number = 1000): Promise<SupabaseExpense[]> {
    this.logger.log('Extracting expenses from Supabase...');

    try {
      const allExpenses: SupabaseExpense[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const to = from + batchSize - 1;

        const { data, error } = await this.supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: true })
          .range(from, to);

        if (error) {
          throw new Error(`Failed to fetch expenses: ${error.message}`);
        }

        if (data && data.length > 0) {
          // Log first record to see actual schema
          if (allExpenses.length === 0 && data.length > 0) {
            this.logger.log('Sample expense record from Supabase:');
            this.logger.log(JSON.stringify(data[0], null, 2));
          }

          allExpenses.push(...(data as SupabaseExpense[]));
          this.logger.log(`Extracted batch: ${from + 1}-${from + data.length} expenses`);

          hasMore = data.length === batchSize;
          from += batchSize;
        } else {
          hasMore = false;
        }
      }

      this.logger.log(`Extracted ${allExpenses.length} total expenses from Supabase`);
      return allExpenses;
    } catch (error) {
      this.logger.error('Error extracting expenses from Supabase', error);
      throw error;
    }
  }

  async getUserEmailMap(userIds: string[]): Promise<Map<string, string>> {
    this.logger.log(`Fetching user emails for ${userIds.length} users from Supabase Auth...`);

    try {
      const emailMap = new Map<string, string>();

      // Batch user lookups to avoid overwhelming the API
      const batchSize = 50;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        const { data, error } = await this.supabase.auth.admin.listUsers();

        if (error) {
          throw new Error(`Failed to fetch user emails: ${error.message}`);
        }

        if (data && data.users) {
          for (const user of data.users) {
            if (batch.includes(user.id) && user.email) {
              emailMap.set(user.id, user.email);
            }
          }
        }
      }

      this.logger.log(`Successfully mapped ${emailMap.size} user emails`);
      return emailMap;
    } catch (error) {
      this.logger.error('Error fetching user emails from Supabase', error);
      throw error;
    }
  }
}
