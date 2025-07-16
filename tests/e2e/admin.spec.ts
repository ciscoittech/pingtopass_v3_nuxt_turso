import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.goto('/admin')
  })

  test('should display admin dashboard', async ({ page }) => {
    // Check for admin sections
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    await expect(page.locator('text=Quick Stats')).toBeVisible()
  })

  test('should navigate to vendors page', async ({ page }) => {
    await page.goto('/admin/vendors')
    
    // Check vendors page elements
    await expect(page.locator('text=Vendors')).toBeVisible()
    await expect(page.locator('button:has-text("Add Vendor")')).toBeVisible()
    
    // Check for vendors table or cards
    const vendorsList = page.locator('.v-card, .v-table')
    await expect(vendorsList.first()).toBeVisible()
  })

  test('should navigate to exams management', async ({ page }) => {
    await page.goto('/admin/exams')
    
    // Check exams page elements
    await expect(page.locator('text=Exams Management')).toBeVisible()
    await expect(page.locator('button:has-text("Add Exam")')).toBeVisible()
    
    // Check for search functionality
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
  })

  test('should navigate to questions management', async ({ page }) => {
    await page.goto('/admin/questions')
    
    // Check questions page elements
    await expect(page.locator('text=Questions')).toBeVisible()
    await expect(page.locator('button:has-text("Add Question")')).toBeVisible()
    
    // Check for filters
    await expect(page.locator('text=Filter')).toBeVisible()
  })

  test('should show Twitter Intelligence in sidebar', async ({ page }) => {
    await page.goto('/admin')
    
    // Check for Twitter Intelligence section in sidebar
    const twitterSection = page.locator('text=Twitter Intelligence')
    await expect(twitterSection).toBeVisible()
    
    // Click to expand if needed
    await twitterSection.click()
    
    // Check for Twitter submenu items
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Competitor Analysis')).toBeVisible()
    await expect(page.locator('text=Content Strategy')).toBeVisible()
    await expect(page.locator('text=Monitoring & Alerts')).toBeVisible()
  })
})