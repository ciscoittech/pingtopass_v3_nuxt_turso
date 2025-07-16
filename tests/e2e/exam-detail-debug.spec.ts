import { test, expect } from '@playwright/test'

test.describe('Exam Detail Page Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Mock minimal auth to bypass login
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'debug-user', email: 'debug@test.com', name: 'Debug User' }
        })
      })
    })
  })

  test('should debug exam detail page button selectors', async ({ page }) => {
    console.log('🔍 Starting exam detail page debug')
    
    // Navigate directly to first exam
    await page.goto('/exams/exam_1752523451149_7ca9j5a83')
    await page.waitForLoadState('networkidle')
    console.log(`📍 Exam detail page loaded: ${page.url()}`)
    
    // Take screenshot
    await page.screenshot({ path: 'exam-detail-debug.png', fullPage: true })
    console.log('📸 Exam detail page screenshot saved')
    
    // Debug: Find all buttons on the page
    const allButtons = page.locator('button')
    const buttonCount = await allButtons.count()
    console.log(`🔍 Found ${buttonCount} buttons on exam detail page`)
    
    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const buttonText = await allButtons.nth(i).textContent()
      const buttonClasses = await allButtons.nth(i).getAttribute('class')
      const buttonSize = await allButtons.nth(i).getAttribute('size')
      console.log(`🔸 Button ${i + 1}: "${buttonText}" | size="${buttonSize}" | classes="${buttonClasses?.substring(0, 100)}..."`)
    }
    
    // Debug: Find the mode selector
    console.log('\n🔍 Looking for mode selector...')
    const studyOptionsCard = page.locator('text=Choose Study Mode').locator('..')
    if (await studyOptionsCard.count() > 0) {
      console.log('✅ Found "Choose Study Mode" section')
      
      const modeSelector = studyOptionsCard.locator('.v-select')
      if (await modeSelector.count() > 0) {
        console.log('✅ Found mode selector')
        
        // Get current selected value
        const selectedValue = await modeSelector.locator('.v-select__selection').textContent()
        console.log(`📄 Current selected mode: "${selectedValue}"`)
        
        // Try to click the selector
        await modeSelector.click()
        await page.waitForTimeout(1000)
        
        // Look for dropdown options
        const dropdownOptions = page.locator('.v-menu .v-list-item')
        const optionCount = await dropdownOptions.count()
        console.log(`🔍 Found ${optionCount} dropdown options`)
        
        for (let i = 0; i < optionCount; i++) {
          const optionText = await dropdownOptions.nth(i).textContent()
          console.log(`📋 Option ${i + 1}: "${optionText}"`)
        }
        
        // Close dropdown
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        
      } else {
        console.log('❌ Mode selector not found')
      }
    } else {
      console.log('❌ "Choose Study Mode" section not found')
    }
    
    // Debug: Look for action buttons with different selectors
    console.log('\n🔍 Looking for action buttons...')
    const actionButtonSelectors = [
      'button[size="x-large"]',
      'button[size="large"]',
      'button:has-text("Start")',
      'button:has-text("Studying")',
      'button:has-text("Test")',
      '.v-btn--size-x-large',
      '.v-btn--size-large',
      'button.v-btn--size-x-large',
      'button.v-btn--size-large'
    ]
    
    for (const selector of actionButtonSelectors) {
      const buttons = page.locator(selector)
      const count = await buttons.count()
      if (count > 0) {
        console.log(`✅ Found ${count} button(s) with selector: ${selector}`)
        const buttonText = await buttons.first().textContent()
        console.log(`📄 Button text: "${buttonText}"`)
      } else {
        console.log(`❌ No buttons found with selector: ${selector}`)
      }
    }
    
    // Always pass - this is debugging
    expect(true).toBe(true)
  })
})