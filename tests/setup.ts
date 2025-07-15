import { vi } from 'vitest'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Mock getUserSession globally for tests
global.getUserSession = vi.fn()
global.setUserSession = vi.fn()
global.createError = vi.fn()
global.readBody = vi.fn()
global.$fetch = vi.fn()

// Setup test database or mocks
export const setupTestDb = () => {
  // Mock database operations
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    get: vi.fn(),
    all: vi.fn()
  }
}

// Set up test environment variables if not already set
if (!process.env.OPENROUTER_API_KEY) {
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
}
if (!process.env.LANGCHAIN_API_KEY) {
  process.env.LANGCHAIN_API_KEY = 'test-langchain-key'
}
if (!process.env.TURSO_DB_URL) {
  process.env.TURSO_DB_URL = 'test-db-url'
}
if (!process.env.TURSO_DB_TOKEN) {
  process.env.TURSO_DB_TOKEN = 'test-db-token'
}