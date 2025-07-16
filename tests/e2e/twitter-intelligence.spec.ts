import { test, expect } from '@playwright/test'

test.describe('Twitter Intelligence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Twitter Intelligence
    await page.goto('/admin/twitter')
  })

  test('should display Twitter Analytics dashboard', async ({ page }) => {
    // Check page title
    await expect(page.locator('text=Twitter Analytics Dashboard')).toBeVisible()
    
    // Check stats cards
    await expect(page.locator('text=Competitors Tracked')).toBeVisible()
    await expect(page.locator('text=Tweets Analyzed')).toBeVisible()
    await expect(page.locator('text=Content Ideas')).toBeVisible()
    await expect(page.locator('text=Active Alerts')).toBeVisible()
  })

  test('should show recent analyses', async ({ page }) => {
    // Check for recent analyses section
    await expect(page.locator('text=Recent Analyses')).toBeVisible()
    
    // Check for analysis items or empty state
    const analysesList = page.locator('.v-list-item').filter({ hasText: 'insights' })
    const emptyState = page.locator('text=No analyses yet')
    
    // Either list or empty state should be visible
    const hasAnalyses = await analysesList.count() > 0
    const isEmpty = await emptyState.isVisible()
    
    expect(hasAnalyses || isEmpty).toBeTruthy()
  })

  test('should show quick actions', async ({ page }) => {
    // Check quick actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible()
    
    // Check action buttons
    await expect(page.locator('text=Add Competitor')).toBeVisible()
    await expect(page.locator('text=Run Analysis')).toBeVisible()
    await expect(page.locator('text=Content Strategy')).toBeVisible()
  })

  test('should navigate to competitor analysis', async ({ page }) => {
    // Click on competitor analysis in quick actions
    await page.click('text=Add Competitor')
    
    // Should navigate to competitors page
    await expect(page).toHaveURL('/admin/twitter/competitors')
  })

  test('should show engagement trends placeholder', async ({ page }) => {
    // Check for engagement trends section
    await expect(page.locator('text=Engagement Trends')).toBeVisible()
    
    // Should show coming soon message
    await expect(page.locator('text=Coming Soon')).toBeVisible()
  })
})