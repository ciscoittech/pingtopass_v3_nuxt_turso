import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  // Mock authenticated state
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting a cookie or localStorage
    await page.goto('/dashboard')
    // In a real test, you would set up proper authentication
  })

  test('should display dashboard components', async ({ page }) => {
    // Check for main dashboard elements
    await expect(page.locator('.congratulations-card')).toBeVisible()
    await expect(page.locator('text=Study Streak')).toBeVisible()
    await expect(page.locator('text=Questions Answered')).toBeVisible()
    await expect(page.locator('text=Study Progress')).toBeVisible()
  })

  test('should display user stats', async ({ page }) => {
    // Check for stats cards
    const streakCard = page.locator('[data-testid="study-streak-card"]')
    const questionsCard = page.locator('[data-testid="questions-answered-card"]')
    
    // Stats should be visible (even if 0)
    await expect(streakCard).toBeVisible()
    await expect(questionsCard).toBeVisible()
  })
})