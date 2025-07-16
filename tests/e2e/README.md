# E2E Tests

This directory contains end-to-end tests for the PingToPass application using Playwright.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/dashboard.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Run tests with specific browser
npx playwright test --project=chromium
```

## Test Structure

- `navigation.spec.ts` - Tests for basic navigation and routing
- `dashboard.spec.ts` - Tests for the main dashboard functionality
- `exams.spec.ts` - Tests for exam browsing and filtering
- `study-mode.spec.ts` - Tests for study mode features
- `test-mode.spec.ts` - Tests for practice test functionality
- `admin.spec.ts` - Tests for admin panel features
- `twitter-intelligence.spec.ts` - Tests for Twitter Intelligence features
- `responsive.spec.ts` - Tests for responsive design on different devices
- `performance.spec.ts` - Tests for performance and UX

## Writing Tests

Tests follow the Playwright test structure:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path')
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

## Authentication

Since auth is excluded from testing, tests that require authentication should mock the auth state using the helper functions in `helpers/test-utils.ts`.

## CI/CD Integration

Tests are configured to run in CI with:
- Retries on failure
- Parallel execution
- Multiple browser support
- Screenshot on failure
- Video recording on failure