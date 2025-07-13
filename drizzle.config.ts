import type { Config } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

export default {
  schema: './server/database/schema/*',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  },
} satisfies Config