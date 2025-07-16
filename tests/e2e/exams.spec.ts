import { test, expect } from '@playwright/test'

test.describe('Exams Page', () => {
  test('should display exams grid', async ({ page }) => {
    await page.goto('/exams')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Available Exams')
    
    // Check for search functionality
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Check for vendor filter
    const vendorSelect = page.locator('[data-testid="vendor-select"]')
    await expect(vendorSelect).toBeVisible()
  })

  test('should filter exams by search', async ({ page }) => {
    await page.goto('/exams')
    
    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('CompTIA')
    
    // Wait for filtering
    await page.waitForTimeout(500)
    
    // Check that results are filtered
    const examCards = page.locator('.exam-card')
    const count = await examCards.count()
    
    // Should have at least one result if CompTIA exams exist
    if (count > 0) {
      const firstCard = examCards.first()
      await expect(firstCard).toContainText(/CompTIA/i)
    }
  })

  test('should navigate to exam details on click', async ({ page }) => {
    await page.goto('/exams')
    
    // Click first exam card if exists
    const examCards = page.locator('.exam-card')
    const count = await examCards.count()
    
    if (count > 0) {
      await examCards.first().click()
      // Should navigate to exam detail or study page
      await expect(page.url()).toMatch(/\/(study|test|exams)\//)
    }
  })
})