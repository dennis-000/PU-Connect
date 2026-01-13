// Database query optimization utilities

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Optimized batch query for unread message counts
 * Replaces N+1 queries with a single batch query
 */
export async function getUnreadCountsBatch(
  supabase: SupabaseClient,
  conversationIds: string[],
  userId: string
): Promise<Record<string, number>> {
  if (conversationIds.length === 0) return {};

  const { data } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .eq('receiver_id', userId)
    .eq('is_read', false);

  return data?.reduce((acc, msg) => {
    acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
}

/**
 * Optimized query with pagination support
 */
export function createPaginatedQuery<T>(
  supabase: SupabaseClient,
  table: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: Record<string, any>
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .range(from, to);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });
  }

  return query;
}

/**
 * Optimize select fields - only fetch what's needed
 */
export function optimizeSelect(fields: string[], includeRelations: string[] = []): string {
  let select = fields.join(', ');
  
  if (includeRelations.length > 0) {
    const relations = includeRelations.map(rel => {
      const [table, foreignKey] = rel.split(':');
      return `${table}:${foreignKey}(id, full_name, email, avatar_url)`;
    });
    select += `, ${relations.join(', ')}`;
  }
  
  return select;
}

/**
 * Cache key generator for React Query
 */
export function generateCacheKey(prefix: string, filters?: Record<string, any>): string[] {
  const key: string[] = [prefix];
  if (filters) {
    Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          key.push(`${k}:${v}`);
        }
      });
  }
  return key;
}
