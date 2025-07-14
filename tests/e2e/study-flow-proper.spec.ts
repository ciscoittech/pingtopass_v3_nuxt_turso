import { test, expect } from '@playwright/test'

test.describe('Study Mode Flow - Proper Session Management', () => {
  // Helper to mock authenticated user with proper session
  async function mockAuthenticatedUser(page) {
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com'
          }
        })
      })
    })
  }

  // Helper to mock study session start
  async function mockStudySessionStart(page) {
    await page.route('/api/study/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: 'test-session-id',
            examId: 'test-exam-id',
            studyMode: 'practice',
            questions: ['q1', 'q2', 'q3']
          }
        })
      })
    })
  }

  // Helper to mock study progress endpoint
  async function mockStudyProgress(page) {
    await page.route('/api/study/progress', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            progress: {
              sessionId: 'test-session-id',
              examId: 'test-exam-id',
              current: 0,
              total: 3,
              correct: 0,
              incorrect: 0,
              percentage: 0
            },
            currentQuestion: {
              id: 'q1',
              questionText: 'Test question?',
              options: [
                { id: 'a', text: 'Option A' },
                { id: 'b', text: 'Option B' },
                { id: 'c', text: 'Option C' },
                { id: 'd', text: 'Option D' }
              ]
            }
          }
        })
      })
    })
  }

  test.beforeEach(async ({ page }) => {
    // Mock all necessary endpoints
    await mockAuthenticatedUser(page)
    await mockStudySessionStart(page)
    await mockStudyProgress(page)
    
    // Mock exams list
    await page.route('/api/exams', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'test-exam-id',
              examCode: 'TEST-001',
              examName: 'Test Exam',
              vendorName: 'Test Vendor',
              numberOfQuestions: 50
            }
          ]
        })
      })
    })
  })

  test('should require authentication to access study progress', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null })
      })
    })
    
    // Remove progress mock to test real behavior
    await page.unroute('/api/study/progress')
    
    // Navigate to study page
    await page.goto('/study/test-exam-id')
    
    // Should show error or redirect to login
    const errorMessage = page.locator('text=/authentication required/i, text=/please log in/i, text=/401/')
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")')
    
    // Either error message or login prompt should be visible
    const hasError = await errorMessage.count() > 0
    const hasLogin = await loginButton.count() > 0
    
    expect(hasError || hasLogin).toBeTruthy()
  })

  test('should require active study session to fetch progress', async ({ page }) => {
    // Mock authenticated but no study session
    await page.route('/api/study/progress', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: true,
          statusCode: 401,
          statusMessage: 'Valid study session required'
        })
      })
    })
    
    await page.goto('/study/test-exam-id')
    
    // Should show error about missing session
    const errorMessage = page.locator('text=/study session required/i, text=/start.*session/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('should properly start study session before accessing questions', async ({ page }) => {
    // Track API calls
    const apiCalls = {
      startSession: 0,
      getProgress: 0
    }
    
    await page.route('/api/study/start', async route => {
      apiCalls.startSession++
      await mockStudySessionStart(page)
      await route.continue()
    })
    
    await page.route('/api/study/progress', async route => {
      apiCalls.getProgress++
      await mockStudyProgress(page)
      await route.continue()
    })
    
    // Navigate through proper flow
    await page.goto('/exams')
    
    // Click study button for exam
    const studyButton = page.locator('button:has-text("Study"), a:has-text("Study")').first()
    await studyButton.click()
    
    // Wait for navigation to study page
    await page.waitForURL('**/study/**')
    
    // Verify API calls were made in correct order
    expect(apiCalls.startSession).toBeGreaterThan(0)
    expect(apiCalls.getProgress).toBeGreaterThan(0)
    
    // Should see question content
    const questionText = page.locator('.question-text, [data-testid="question-text"]')
    await expect(questionText).toBeVisible()
  })

  test('should handle session expiration gracefully', async ({ page }) => {
    let progressCallCount = 0
    
    await page.route('/api/study/progress', async route => {
      progressCallCount++
      
      // First call succeeds, subsequent calls fail (session expired)
      if (progressCallCount === 1) {
        await mockStudyProgress(page)
        await route.continue()
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: true,
            statusCode: 401,
            statusMessage: 'Session expired'
          })
        })
      }
    })
    
    await page.goto('/study/test-exam-id')
    
    // Initial load should work
    const questionText = page.locator('.question-text')
    await expect(questionText).toBeVisible()
    
    // Trigger a refresh/update that would call progress again
    await page.reload()
    
    // Should show session expired message
    const expiredMessage = page.locator('text=/session expired/i, text=/please start/i')
    await expect(expiredMessage).toBeVisible({ timeout: 5000 })
  })

  test('should validate study session belongs to current user', async ({ page }) => {
    // This would be a backend test, but we can simulate the behavior
    await page.route('/api/study/progress', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: true,
          statusCode: 403,
          statusMessage: 'Access denied: Session does not belong to current user'
        })
      })
    })
    
    await page.goto('/study/test-exam-id')
    
    // Should show access denied error
    const errorMessage = page.locator('text=/access denied/i, text=/forbidden/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Study Mode Error Recovery', () => {
  test('should provide clear action when study session is missing', async ({ page }) => {
    // Mock auth but no session
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', name: 'Test User' }
        })
      })
    })
    
    await page.route('/api/study/progress', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusMessage: 'Valid study session required'
        })
      })
    })
    
    await page.goto('/study/test-exam-id')
    
    // Should show helpful message with action
    const startButton = page.locator('button:has-text("Start Study Session"), a:has-text("Start Study")')
    const backButton = page.locator('button:has-text("Back to Exams"), a:has-text("Choose Exam")')
    
    // At least one action button should be visible
    const hasStartButton = await startButton.count() > 0
    const hasBackButton = await backButton.count() > 0
    
    expect(hasStartButton || hasBackButton).toBeTruthy()
  })
})