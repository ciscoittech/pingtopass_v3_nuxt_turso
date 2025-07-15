import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.nuxt/',
        'coverage/',
        'dist/',
        'build/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'scripts/',
        '_mockApis/',
        'drizzle/',
        'public/',
        'docs/'
      ]
    },
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
})