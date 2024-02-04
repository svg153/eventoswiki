import type { SupabaseClient } from './supabase-client'

export class SupabaseDatabaseRepository {
  constructor(private readonly supabase: SupabaseClient, private readonly entity: string) {}

  from() {
    return this.supabase.client.from(this.entity)
  }
}