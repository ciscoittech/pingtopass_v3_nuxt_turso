import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        TURSO_URL: 'libsql://test.turso.io',
        TURSO_AUTH_TOKEN: 'test-token',
        OPENROUTER_API_KEY: 'test-key',
        DEFAULT_MODEL: 'anthropic/claude-3.5-haiku',
        ENVIRONMENT: 'test'
      },
      kvNamespaces: ['RESEARCH_CACHE', 'QUESTION_CACHE'],
      durableObjects: {
        PROGRESS: 'ProgressTracker'
      },
      queueProducers: {
        QUESTION_QUEUE: {
          delivery_delay: 0
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts'
      ]
    },
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})