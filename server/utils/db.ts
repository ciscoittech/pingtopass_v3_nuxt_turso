import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig()
    
    if (!config.tursoDbUrl || !config.tursoDbToken) {
      throw new Error('Turso database credentials not configured')
    }

    const client = createClient({
      url: config.tursoDbUrl,
      authToken: config.tursoDbToken,
    })

    _db = drizzle(client, { schema })
  }

  return _db
}

