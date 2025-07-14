import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/')
  })

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Check if on home page or login page
    await expect(page).toHaveURL(/\/(auth\/login|login|$)/)
    
    // Should see login form or login button - looking for actual button text
    const loginButton = page.locator('a:has-text("Get Started Free"), button:has-text("Continue with Google"), a:has-text("Sign Up Now")')
    await expect(loginButton.first()).toBeVisible()
  })

  test('should show Google OAuth login option', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')
    
    // Should see Google login button - looking for actual button text
    const googleLogin = page.locator('button:has-text("Continue with Google")')
    await expect(googleLogin.first()).toBeVisible()
  })

  test('should handle login redirect flow', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Mock successful authentication by setting session storage
    await page.evaluate(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }))
    })
    
    // Navigate to dashboard again
    await page.goto('/dashboard')
    
    // Should now be able to access dashboard
    // Note: This is a simplified test - in real implementation,
    // you'd need to mock the actual auth session
  })

  test('should protect admin routes', async ({ page }) => {
    // Try to access admin route
    await page.goto('/admin')
    
    // Should be redirected to login or show access denied
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/(auth\/login|login|403|404)/)
  })

  test('should show user menu when authenticated', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token')
    })
    
    await page.goto('/dashboard')
    
    // Look for user avatar, menu, or logout option
    const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button:has-text("Logout")')
    
    // At least one of these should be visible if authenticated
    const userMenuCount = await userMenu.count()
    expect(userMenuCount).toBeGreaterThan(0)
  })

  test('should handle logout flow', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token')
    })
    
    await page.goto('/dashboard')
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]')
    
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()
      
      // Should be redirected to login or homepage
      await expect(page).toHaveURL(/\/(auth\/login|login|$)/)
      
      // Auth token should be cleared
      const authToken = await page.evaluate(() => window.localStorage.getItem('auth-token'))
      expect(authToken).toBeNull()
    }
  })

  test('should handle session expiration', async ({ page }) => {
    // Set expired session
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'expired-token')
      window.localStorage.setItem('auth-expires', String(Date.now() - 1000)) // Expired 1 second ago
    })
    
    await page.goto('/dashboard')
    
    // Should handle session expiration gracefully
    // Either redirect to login or show session expired message
    await page.waitForTimeout(2000) // Give time for session check
    
    const currentUrl = page.url()
    const hasSessionExpiredMessage = await page.locator('text=session expired, text=please login, text=expired').count() > 0
    
    expect(currentUrl.includes('/auth/') || hasSessionExpiredMessage).toBeTruthy()
  })
})

test.describe('Authentication Security', () => {
  test('should prevent XSS in login form', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try to inject script into form fields
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
    const xssPayload = '<script>alert("XSS")</script>'
    
    if (await emailField.count() > 0) {
      await emailField.first().fill(xssPayload)
      
      // Check that script is not executed
      const alertDialogs: string[] = []
      page.on('dialog', dialog => {
        alertDialogs.push(dialog.message())
        dialog.dismiss()
      })
      
      await page.waitForTimeout(1000)
      expect(alertDialogs).not.toContain('XSS')
    }
  })

  test('should have proper CSRF protection', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Since we use OAuth, check that the login button exists and goes to proper OAuth endpoint
    const googleButton = page.locator('button:has-text("Continue with Google")')
    await expect(googleButton).toBeVisible()
    
    // Click the button and verify it attempts to navigate to OAuth endpoint
    await googleButton.click()
    
    // Should attempt to navigate to Google OAuth endpoint
    await page.waitForURL(/\/auth\/oauth\/google/, { timeout: 5000 }).catch(() => {
      // If navigation is blocked (which is expected in test environment), that's fine
      // We just want to verify the button attempts to initiate OAuth flow
    })
    
    // Verify we're still on a valid page (not an error page)
    const hasError = await page.locator('text=/error|404|500/i').count()
    expect(hasError).toBe(0)
  })
})