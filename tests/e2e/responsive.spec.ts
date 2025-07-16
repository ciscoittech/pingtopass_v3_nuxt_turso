import { test, expect, devices } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    })
    const page = await context.newPage()
    
    await page.goto('/')
    
    // Check mobile menu button
    const menuButton = page.locator('[data-testid="mobile-menu-button"], .v-app-bar__nav-icon')
    await expect(menuButton).toBeVisible()
    
    // Check that content adjusts
    const heroText = page.locator('h1')
    await expect(heroText).toBeVisible()
    await expect(heroText).toHaveCSS('font-size', /.+/) // Should have some font size
    
    await context.close()
  })

  test('should handle tablet view', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    })
    const page = await context.newPage()
    
    await page.goto('/exams')
    
    // Check that cards stack properly
    const examCards = page.locator('.v-col')
    const firstCard = examCards.first()
    
    if (await firstCard.isVisible()) {
      // Check that columns adjust for tablet
      await expect(firstCard).toHaveClass(/col-12|md-6/)
    }
    
    await context.close()
  })

  test('should show sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard')
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('.v-navigation-drawer, [data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
  })

  test('should hide sidebar on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    })
    const page = await context.newPage()
    
    await page.goto('/dashboard')
    
    // Sidebar should be hidden by default on mobile
    const sidebar = page.locator('.v-navigation-drawer')
    const isTemporary = await sidebar.evaluate(el => 
      el.classList.contains('v-navigation-drawer--temporary') ||
      getComputedStyle(el).position === 'fixed'
    )
    
    expect(isTemporary).toBeTruthy()
    
    await context.close()
  })
})