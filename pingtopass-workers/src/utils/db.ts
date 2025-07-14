import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client/web'

export function getDB(env: Env) {
  const client = createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN
  })
  
  return drizzle(client)
}

// Re-export schema types from main project
export * from '../../server/database/schema'