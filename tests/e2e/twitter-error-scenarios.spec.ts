import { test, expect, type Page } from '@playwright/test'

// Error Scenario E2E Tests for Twitter Intelligence System
// These tests ensure the system handles failures, edge cases, and error conditions gracefully

test.describe('Twitter Intelligence Error Scenarios', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Network and API Error Handling', () => {
    test('should handle API timeout errors gracefully', async () => {
      // Mock slow API response
      await page.route('**/api/admin/twitter/competitors', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ competitors: [], total: 0 })
          })
        }, 31000) // Simulate timeout (30s + 1s)
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Should show timeout error message
      await expect(page.locator('[data-testid="api-timeout-error"]')).toBeVisible({ timeout: 35000 })
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
      
      // Verify error message content
      await expect(page.locator('[data-testid="api-timeout-error"]')).toContainText('timeout')
    })

    test('should handle 500 internal server errors', async () => {
      // Mock server error
      await page.route('**/api/admin/twitter/insights', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Internal Server Error',
            message: 'Database connection failed'
          })
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-insights-tab"]')

      // Should show server error message
      await expect(page.locator('[data-testid="server-error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="server-error-message"]')).toContainText('server error')
      
      // Should provide retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
      
      // Should suggest contacting support
      await expect(page.locator('[data-testid="contact-support-link"]')).toBeVisible()
    })

    test('should handle 429 rate limit errors', async () => {
      // Mock rate limit error
      await page.route('**/api/admin/twitter/analyze', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Rate limit exceeded',
            retryAfter: 60
          })
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="run-analysis-button"]')
      await page.check('[data-testid="select-competitor-1"]')
      await page.click('[data-testid="start-analysis-button"]')

      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('rate limit')
      await expect(page.locator('[data-testid="retry-countdown"]')).toBeVisible()
      
      // Should show countdown timer
      await expect(page.locator('[data-testid="retry-countdown"]')).toContainText('60')
    })

    test('should handle network connectivity issues', async () => {
      // Simulate network failure
      await page.context().setOffline(true)

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="refresh-overview-button"]')

      // Should show offline message
      await expect(page.locator('[data-testid="offline-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="offline-error"]')).toContainText('connection')
      
      // Restore network
      await page.context().setOffline(false)
      
      // Should automatically retry when online
      await page.click('[data-testid="retry-when-online-button"]')
      await expect(page.locator('[data-testid="offline-error"]')).not.toBeVisible()
    })

    test('should handle partial API failures', async () => {
      // Mock mixed success/failure responses
      let callCount = 0
      await page.route('**/api/admin/twitter/**', route => {
        callCount++
        if (callCount % 2 === 0) {
          // Fail every second request
          route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service temporarily unavailable' })
          })
        } else {
          route.continue()
        }
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="refresh-all-data-button"]')

      // Should show partial failure warning
      await expect(page.locator('[data-testid="partial-failure-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="failed-sections-list"]')).toBeVisible()
      
      // Should allow retry of failed sections
      await expect(page.locator('[data-testid="retry-failed-sections"]')).toBeVisible()
    })
  })

  test.describe('Data Validation and Edge Cases', () => {
    test('should handle empty datasets gracefully', async () => {
      // Mock empty responses
      await page.route('**/api/admin/twitter/**', route => {
        const url = route.request().url()
        if (url.includes('competitors')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ competitors: [], total: 0 })
          })
        } else if (url.includes('insights')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ insights: [], total: 0 })
          })
        } else if (url.includes('trends')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ trends: [] })
          })
        } else {
          route.continue()
        }
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')

      // Check competitors section
      await page.click('[data-testid="twitter-competitors-tab"]')
      await expect(page.locator('[data-testid="no-competitors-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-first-competitor-cta"]')).toBeVisible()

      // Check insights section
      await page.click('[data-testid="twitter-insights-tab"]')
      await expect(page.locator('[data-testid="no-insights-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="run-analysis-cta"]')).toBeVisible()

      // Check trends section
      await page.click('[data-testid="twitter-trends-tab"]')
      await expect(page.locator('[data-testid="no-trends-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="refresh-trends-cta"]')).toBeVisible()
    })

    test('should validate competitor username formats', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Test invalid usernames
      const invalidUsernames = [
        '', // Empty
        'a', // Too short
        'a'.repeat(50), // Too long
        '@invalid@user', // Invalid characters
        '123numbers', // Numbers only
        'spaces in name', // Spaces
        'special!chars#', // Special characters
        'ALLCAPS', // All caps (might be valid but discouraged)
      ]

      for (const username of invalidUsernames) {
        await page.fill('[data-testid="competitor-username-input"]', username)
        await page.click('[data-testid="add-competitor-button"]')
        
        // Should show validation error
        await expect(page.locator('[data-testid="username-validation-error"]')).toBeVisible()
        
        // Clear input for next test
        await page.fill('[data-testid="competitor-username-input"]', '')
      }
    })

    test('should handle malformed API responses', async () => {
      // Mock malformed JSON response
      await page.route('**/api/admin/twitter/competitors', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {'
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Should show data parsing error
      await expect(page.locator('[data-testid="data-parsing-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="data-parsing-error"]')).toContainText('format')
    })

    test('should handle missing required fields in API responses', async () => {
      // Mock response with missing fields
      await page.route('**/api/admin/twitter/insights', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            insights: [
              {
                id: 'insight_1',
                // Missing title, description, confidence, etc.
                type: 'content_strategy'
              }
            ],
            total: 1
          })
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-insights-tab"]')

      // Should handle missing data gracefully
      await expect(page.locator('[data-testid="insight-card-insight_1"]')).toBeVisible()
      await expect(page.locator('[data-testid="missing-data-warning"]')).toBeVisible()
    })
  })

  test.describe('User Input and Form Error Handling', () => {
    test('should handle form submission during network interruption', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Start filling form
      await page.fill('[data-testid="competitor-username-input"]', 'validuser')
      await page.selectOption('[data-testid="competitor-category-select"]', 'cloud-certifications')

      // Simulate network going down during submission
      await page.context().setOffline(true)
      await page.click('[data-testid="add-competitor-button"]')

      // Should show network error
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
      
      // Should preserve form data
      expect(await page.inputValue('[data-testid="competitor-username-input"]')).toBe('validuser')
      
      // Restore network and retry
      await page.context().setOffline(false)
      await page.click('[data-testid="retry-submission-button"]')
      
      // Should succeed
      await expect(page.locator('[data-testid="network-error"]')).not.toBeVisible()
    })

    test('should prevent duplicate form submissions', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      await page.fill('[data-testid="competitor-username-input"]', 'testuser')
      
      // Click submit button multiple times rapidly
      await Promise.all([
        page.click('[data-testid="add-competitor-button"]'),
        page.click('[data-testid="add-competitor-button"]'),
        page.click('[data-testid="add-competitor-button"]')
      ])

      // Should only show one loading state
      const loadingStates = page.locator('[data-testid="add-competitor-loading"]')
      expect(await loadingStates.count()).toBeLessThanOrEqual(1)
      
      // Button should be disabled during submission
      await expect(page.locator('[data-testid="add-competitor-button"]')).toBeDisabled()
    })

    test('should handle concurrent analysis requests', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Mock analysis endpoint to be slow
      await page.route('**/api/admin/twitter/analyze', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ analysis: null, cost: 0 })
          })
        }, 2000)
      })

      // Start first analysis
      await page.click('[data-testid="run-analysis-button"]')
      await page.check('[data-testid="select-competitor-1"]')
      await page.click('[data-testid="start-analysis-button"]')

      // Try to start second analysis while first is running
      await page.click('[data-testid="run-analysis-button"]')
      
      // Should show "analysis in progress" message
      await expect(page.locator('[data-testid="analysis-in-progress-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="analysis-in-progress-error"]')).toContainText('in progress')
    })
  })

  test.describe('Authentication and Authorization Errors', () => {
    test('should handle session expiration', async () => {
      // Mock 401 unauthorized response
      await page.route('**/api/admin/twitter/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="refresh-overview-button"]')

      // Should show session expired message
      await expect(page.locator('[data-testid="session-expired-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-redirect-button"]')).toBeVisible()
    })

    test('should handle insufficient permissions', async () => {
      // Mock 403 forbidden response
      await page.route('**/api/admin/twitter/analyze', route => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Insufficient permissions',
            requiredRole: 'admin'
          })
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="run-analysis-button"]')

      // Should show permission error
      await expect(page.locator('[data-testid="permission-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="permission-error"]')).toContainText('permission')
      await expect(page.locator('[data-testid="contact-admin-button"]')).toBeVisible()
    })
  })

  test.describe('Resource Limits and Constraints', () => {
    test('should handle analysis cost limits', async () => {
      // Mock cost limit exceeded response
      await page.route('**/api/admin/twitter/analyze-langchain', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Monthly analysis budget exceeded',
            remainingBudget: 0,
            resetDate: '2024-02-01'
          })
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="run-analysis-button"]')
      await page.check('[data-testid="select-competitor-1"]')
      await page.check('[data-testid="include-recommendations"]')
      await page.click('[data-testid="start-analysis-button"]')

      // Should show budget exceeded message
      await expect(page.locator('[data-testid="budget-exceeded-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="budget-exceeded-error"]')).toContainText('budget')
      await expect(page.locator('[data-testid="upgrade-plan-button"]')).toBeVisible()
    })

    test('should handle competitor limit reached', async () => {
      // Mock competitor limit response
      await page.route('**/api/admin/twitter/competitors', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Competitor limit reached',
              currentCount: 50,
              maxAllowed: 50
            })
          })
        } else {
          route.continue()
        }
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')
      
      await page.fill('[data-testid="competitor-username-input"]', 'newcompetitor')
      await page.click('[data-testid="add-competitor-button"]')

      // Should show limit reached message
      await expect(page.locator('[data-testid="competitor-limit-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="competitor-limit-error"]')).toContainText('limit')
      await expect(page.locator('[data-testid="manage-competitors-link"]')).toBeVisible()
    })
  })

  test.describe('Browser and Client-Side Error Handling', () => {
    test('should handle browser storage quota exceeded', async () => {
      // Fill up localStorage to near capacity
      await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1024 * 1024) // 1MB string
          for (let i = 0; i < 10; i++) {
            localStorage.setItem(`large_item_${i}`, largeData)
          }
        } catch (e) {
          // Storage quota exceeded
        }
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Should show storage warning
      await expect(page.locator('[data-testid="storage-warning"]')).toBeVisible()
      await expect(page.locator('[data-testid="clear-cache-button"]')).toBeVisible()
    })

    test('should handle JavaScript errors gracefully', async () => {
      // Inject a JavaScript error
      await page.addInitScript(() => {
        window.addEventListener('load', () => {
          // Simulate a runtime error in application code
          setTimeout(() => {
            throw new Error('Simulated runtime error')
          }, 1000)
        })
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Should show error boundary or graceful degradation
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible()
      await expect(page.locator('[data-testid="reload-page-button"]')).toBeVisible()
    })

    test('should handle memory usage warnings', async () => {
      // Simulate high memory usage scenario
      await page.evaluate(() => {
        // Create large arrays to consume memory
        const largeArrays = []
        for (let i = 0; i < 100; i++) {
          largeArrays.push(new Array(100000).fill('memory test'))
        }
        window.testArrays = largeArrays
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="refresh-all-data-button"]')

      // Should show performance warning if memory usage is high
      // Note: This may or may not trigger depending on browser and system
      const performanceWarning = page.locator('[data-testid="performance-warning"]')
      if (await performanceWarning.isVisible()) {
        await expect(performanceWarning).toContainText('performance')
        await expect(page.locator('[data-testid="optimize-performance-tips"]')).toBeVisible()
      }
    })
  })

  test.describe('Recovery and Resilience Testing', () => {
    test('should recover from temporary API failures', async () => {
      let failureCount = 0
      
      // Mock API to fail first 2 attempts, then succeed
      await page.route('**/api/admin/twitter/competitors', route => {
        failureCount++
        if (failureCount <= 2) {
          route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service temporarily unavailable' })
          })
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ competitors: [], total: 0 })
          })
        }
      })

      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Should show error initially
      await expect(page.locator('[data-testid="service-unavailable-error"]')).toBeVisible()
      
      // Click retry
      await page.click('[data-testid="retry-button"]')
      
      // Should still show error (second failure)
      await expect(page.locator('[data-testid="service-unavailable-error"]')).toBeVisible()
      
      // Click retry again
      await page.click('[data-testid="retry-button"]')
      
      // Should succeed on third attempt
      await expect(page.locator('[data-testid="service-unavailable-error"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="competitors-section"]')).toBeVisible()
    })

    test('should maintain data consistency after errors', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Add a competitor successfully
      await page.fill('[data-testid="competitor-username-input"]', 'testuser1')
      await page.click('[data-testid="add-competitor-button"]')
      await expect(page.locator('[data-testid="competitor-card-testuser1"]')).toBeVisible()

      // Mock API error for next addition
      await page.route('**/api/admin/twitter/competitors', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          })
        } else {
          route.continue()
        }
      })

      // Try to add another competitor (should fail)
      await page.fill('[data-testid="competitor-username-input"]', 'testuser2')
      await page.click('[data-testid="add-competitor-button"]')
      await expect(page.locator('[data-testid="server-error-message"]')).toBeVisible()

      // First competitor should still be visible
      await expect(page.locator('[data-testid="competitor-card-testuser1"]')).toBeVisible()
      
      // Second competitor should not be visible
      await expect(page.locator('[data-testid="competitor-card-testuser2"]')).not.toBeVisible()
    })

    test('should provide helpful error messages and next steps', async () => {
      // Mock various error scenarios and verify helpful messaging
      const errorScenarios = [
        {
          status: 404,
          error: 'Not found',
          expectedMessage: 'resource not found',
          expectedAction: 'check the URL'
        },
        {
          status: 502,
          error: 'Bad gateway',
          expectedMessage: 'server temporarily unavailable',
          expectedAction: 'try again later'
        },
        {
          status: 408,
          error: 'Request timeout',
          expectedMessage: 'request timed out',
          expectedAction: 'check your connection'
        }
      ]

      for (const scenario of errorScenarios) {
        await page.route('**/api/admin/twitter/insights', route => {
          route.fulfill({
            status: scenario.status,
            contentType: 'application/json',
            body: JSON.stringify({ error: scenario.error })
          })
        })

        await page.click('[data-testid="nav-twitter-intelligence"]')
        await page.click('[data-testid="twitter-insights-tab"]')

        // Should show helpful error message
        const errorMessage = page.locator('[data-testid="error-message"]')
        await expect(errorMessage).toBeVisible()
        await expect(errorMessage).toContainText(scenario.expectedMessage)
        
        // Should provide helpful next steps
        const helpText = page.locator('[data-testid="error-help-text"]')
        await expect(helpText).toBeVisible()
        await expect(helpText).toContainText(scenario.expectedAction)

        // Clear route for next iteration
        await page.unroute('**/api/admin/twitter/insights')
      }
    })
  })
})