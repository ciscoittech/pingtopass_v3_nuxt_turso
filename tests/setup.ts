import { vi } from 'vitest'

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