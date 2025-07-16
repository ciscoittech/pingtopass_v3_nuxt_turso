import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate to main pages', async ({ page }) => {
    await page.goto('/')
    
    // Check landing page
    await expect(page).toHaveTitle(/PingToPass/)
    await expect(page.locator('h1')).toContainText('Pass Your IT Certification Exams')
    
    // Check main navigation links exist
    const getStartedButton = page.locator('text=Get Started Free')
    await expect(getStartedButton).toBeVisible()
  })

  test('should show login page when clicking get started', async ({ page }) => {
    await page.goto('/')
    
    // Click get started button
    await page.click('text=Get Started Free')
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login')
  })
})