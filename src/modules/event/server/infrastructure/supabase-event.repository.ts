import type { SupabaseClient } from '@/shared/infrastructure/supabase/supabase-client'
import { SupabaseDatabaseRepository } from '@/shared/infrastructure/supabase/supabase-database-repository'
import type { EventCriteria } from '../domain/criterias/event-criteria'
import type { Event } from '../domain/event'
import type { EventRepository } from '../domain/repositories/event-repository'
import type { EventSlug } from '../domain/value-objects/event-slug'
import type { SupabaseEventDto } from './dtos/supabase-event.dto'
import { SupabaseEventFiltersMapper } from './mappers/supabase-event-filters.mapper'
import { SupabaseEventOrderMapper } from './mappers/supabase-event-order.mapper'
import { SupabaseEventMapper } from './mappers/supabase-event.mapper'

export class SupabaseEventRepository extends SupabaseDatabaseRepository implements EventRepository {
  private static EVENT_SELECT_QUERY = '*, categories(name), events_social_networks(*)'

  constructor(supabase: SupabaseClient) {
    super(supabase, 'events')
  }

  async findAll() {
    const { data, error } = await this.from().select(SupabaseEventRepository.EVENT_SELECT_QUERY)

    if (error?.code) {
      throw new Error(error.message)
    }

    return SupabaseEventMapper.toDomainList(data as SupabaseEventDto[])
  }

  async match(criteria: EventCriteria): Promise<Event[]> {
    const query = this.from().select(SupabaseEventRepository.EVENT_SELECT_QUERY)
    if (criteria.filters) {
      Object.entries(SupabaseEventFiltersMapper.toDto(criteria.filters)).forEach(([key, filter]) => {
        if (!filter) return

        switch (filter.operator) {
          case 'eq':
            query.eq(key, filter.value)
            break
          case 'gt':
            query.gt(key, filter.value)
            break
          case 'lt':
            query.lt(key, filter.value)
            break
          case 'gte':
            query.gte(key, filter.value)
            break
          case 'lte':
            query.lte(key, filter.value)
            break
        }
      })
    }

    if (criteria.order) {
      Object.entries(SupabaseEventOrderMapper.toDto(criteria.order)).forEach(([key, order]) => {
        if (!order) return
        query.order(key, { ascending: order === 'asc' })
      })
    }

    if (criteria.offset && criteria.limit) {
      query.range(criteria.offset, criteria.offset + criteria.limit)
    } else if (criteria.limit) {
      query.limit(criteria.limit)
    }

    const { data, error } = await query
    if (error?.code) {
      throw new Error(error.message)
    }

    return SupabaseEventMapper.toDomainList(data as SupabaseEventDto[])
  }

  async find(id: EventSlug): Promise<Event> {
    const { data, error } = await this.from().select(SupabaseEventRepository.EVENT_SELECT_QUERY).eq('slug', id.value)

    if (error?.code || !data?.length) {
      throw new EventNotFoundError(id.value)
    }

    return SupabaseEventMapper.toDomain(data[0] as SupabaseEventDto)
  }
}
