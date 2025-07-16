import { test, expect } from '@playwright/test'

test.describe('Performance & UX', () => {
  test('should load landing page quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check that main content is visible
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should handle navigation smoothly', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Navigate to different pages and ensure smooth transitions
    const routes = ['/exams', '/study', '/test', '/progress']
    
    for (const route of routes) {
      const startTime = Date.now()
      await page.goto(route)
      const navTime = Date.now() - startTime
      
      // Navigation should be quick
      expect(navTime).toBeLessThan(2000)
      
      // Page should have content
      const mainContent = page.locator('main, .v-main')
      await expect(mainContent).toBeVisible()
    }
  })

  test('should handle search input debouncing', async ({ page }) => {
    await page.goto('/exams')
    
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Type quickly to test debouncing
    await searchInput.fill('Comp')
    await page.waitForTimeout(100)
    await searchInput.fill('CompTIA')
    
    // Should not cause performance issues
    await expect(page.locator('.v-card')).toBeVisible()
  })

  test('should lazy load images', async ({ page }) => {
    await page.goto('/exams')
    
    // Check for lazy loading attributes on images
    const images = page.locator('img')
    const count = await images.count()
    
    if (count > 0) {
      const firstImage = images.first()
      const loading = await firstImage.getAttribute('loading')
      
      // Images should use lazy loading
      expect(loading).toBe('lazy')
    }
  })

  test('should handle form interactions', async ({ page }) => {
    await page.goto('/admin/questions')
    
    // Click add button if available
    const addButton = page.locator('button:has-text("Add Question")')
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Dialog should open quickly
      const dialog = page.locator('.v-dialog')
      await expect(dialog).toBeVisible({ timeout: 1000 })
      
      // Close dialog
      const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close")')
      if (await closeButton.isVisible()) {
        await closeButton.click()
        await expect(dialog).not.toBeVisible({ timeout: 1000 })
      }
    }
  })
})