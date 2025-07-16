import { Page } from '@playwright/test'

export async function loginTestUser(page: Page) {
  // Simple test login approach - navigate to login page first
  await page.goto('/auth/login')
  
  // Try to find login form elements and perform login
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"]')
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]')
  const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]')
  
  if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
    await emailInput.fill('test@example.com')
    await passwordInput.fill('testpassword')
    
    if (await loginButton.count() > 0) {
      await loginButton.click()
      await page.waitForLoadState('networkidle')
    }
  }
  
  // Alternative: Try OAuth login if available
  const googleLoginButton = page.locator('button:has-text("Google"), .google-login, [href*="oauth"]')
  if (await googleLoginButton.count() > 0) {
    // For testing, we might need to mock the OAuth flow
    console.log('OAuth login detected - may need mocking for tests')
  }
}

export async function skipAuthForTesting(page: Page) {
  // Method 1: Try to set session/auth cookies directly
  await page.addInitScript(() => {
    // Mock the auth state in localStorage or sessionStorage
    localStorage.setItem('auth-user', JSON.stringify({
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false
    }))
  })

  // Method 2: Mock the auth API endpoint
  await page.route('/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          isAdmin: false
        }
      })
    })
  })
}

export async function mockExamData(page: Page) {
  // Mock exam API endpoints to provide test data
  await page.route('/api/exams', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          exams: [
            {
              id: 'test-exam-1',
              code: 'TEST-001',
              name: 'Test Certification Exam',
              vendorId: 'test-vendor',
              vendor: { name: 'Test Vendor', id: 'test-vendor' },
              vendorName: 'Test Vendor',
              numberOfQuestions: 50,
              totalQuestions: 50,
              examDuration: 90,
              duration: 90,
              passingScore: 70,
              difficulty: 'intermediate',
              description: 'A test exam for testing purposes',
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
          ],
          total: 1,
          page: 1,
          pageSize: 50,
          hasMore: false
        }
      })
    })
  })

  // Mock single exam endpoint
  await page.route('/api/exams/test-exam-1', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'test-exam-1',
          code: 'TEST-001',
          name: 'Test Certification Exam',
          vendorId: 'test-vendor',
          vendor: { name: 'Test Vendor', id: 'test-vendor' },
          vendorName: 'Test Vendor',
          numberOfQuestions: 50,
          totalQuestions: 50,
          examDuration: 90,
          duration: 90,
          passingScore: 70,
          difficulty: 'intermediate',
          description: 'A test exam for testing purposes',
          isActive: true,
          objectives: [
            {
              id: 'obj-1',
              title: 'Test Objective 1',
              description: 'Testing fundamental concepts',
              weight: 30,
              order: 1
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      })
    })
  })

  // Mock progress API
  await page.route('/api/progress/exams*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          examPerformance: []
        }
      })
    })
  })

  // Mock questions count API
  await page.route('/api/exams/*/questions/count', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          count: 50
        }
      })
    })
  })
}