import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle> | null = null
let _client: Client | null = null

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig()
    
    if (!config.tursoDbUrl || !config.tursoDbToken) {
      throw new Error('Turso database credentials not configured')
    }

    _client = createClient({
      url: config.tursoDbUrl,
      authToken: config.tursoDbToken,
    })

    _db = drizzle(_client, { schema })
  }

  return _db
}

export function useDBClient() {
  if (!_client) {
    // Initialize DB first to ensure client is created
    useDB()
  }
  return _client!
}

