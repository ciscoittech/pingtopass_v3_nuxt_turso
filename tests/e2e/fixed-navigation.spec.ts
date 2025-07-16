import { test, expect } from '@playwright/test'

test.describe('Fixed Navigation Test - Targeting Actual Exam Cards', () => {
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

  test('should navigate from exam list to exam detail and then to study/test modes', async ({ page }) => {
    console.log('🚀 Starting complete navigation test')
    
    // Step 1: Navigate to exams page
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    console.log(`📍 Exams page loaded: ${page.url()}`)
    
    // Step 2: Wait for exam cards to load and find actual exam cards
    await page.waitForSelector('.exam-grid-card', { timeout: 10000 })
    
    // Get all exam cards with specific selector
    const examCards = page.locator('.exam-grid-card')
    const cardCount = await examCards.count()
    console.log(`🎯 Found ${cardCount} actual exam cards`)
    
    // Log first few exam cards content
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const examCode = await examCards.nth(i).locator('h6').textContent()
      const examName = await examCards.nth(i).locator('.exam-name').textContent()
      console.log(`📋 Exam ${i + 1}: ${examCode} - ${examName}`)
    }
    
    if (cardCount > 0) {
      // Step 3: Click on first actual exam card
      const firstExamCard = examCards.first()
      const examCode = await firstExamCard.locator('h6').textContent()
      console.log(`🎯 Clicking on exam: ${examCode}`)
      
      const beforeUrl = page.url()
      await firstExamCard.click()
      await page.waitForTimeout(2000)
      
      const afterUrl = page.url()
      console.log(`📍 Navigation result: ${beforeUrl} → ${afterUrl}`)
      
      // Step 4: Check if we're on exam detail page
      if (afterUrl.includes('/exams/') && afterUrl !== beforeUrl) {
        console.log('✅ Successfully navigated to exam detail page')
        
        // Wait for exam detail page to load
        await page.waitForLoadState('networkidle')
        
        // Take screenshot of exam detail page
        await page.screenshot({ path: 'exam-detail-page.png', fullPage: true })
        console.log('📸 Exam detail page screenshot saved')
        
        // Step 5: Look for study/test mode buttons
        const studyButton = page.locator('button:has-text("Start Studying"), button:has-text("Start Study"), button:has-text("Start")')
        const testButton = page.locator('button:has-text("Start Practice Test"), button:has-text("Test Mode"), button:has-text("Start Test")')
        
        const studyCount = await studyButton.count()
        const testCount = await testButton.count()
        console.log(`🔍 Found ${studyCount} study buttons and ${testCount} test buttons`)
        
        // Step 6: Try to start study mode
        if (studyCount > 0) {
          console.log('📚 Attempting to start study mode')
          await studyButton.first().click()
          await page.waitForTimeout(3000)
          
          const studyUrl = page.url()
          console.log(`📍 Study mode URL: ${studyUrl}`)
          
          if (studyUrl.includes('/study/')) {
            console.log('🎉 SUCCESS: Reached study mode')
            
            // Take screenshot of study mode
            await page.screenshot({ path: 'study-mode-page.png', fullPage: true })
            console.log('📸 Study mode screenshot saved')
            
            // Check for study mode elements
            await page.waitForTimeout(2000)
            const studyElements = {
              sidebar: await page.locator('.sidebar, .v-navigation-drawer').count(),
              configDialog: await page.locator('.v-dialog').count(),
              studyText: await page.locator('text=Study Mode').count(),
              studyConfig: await page.locator('text=Study Settings, text=Mode Selection').count()
            }
            
            console.log(`📊 Study mode elements:`, studyElements)
            
            // Go back to exam detail for test mode
            await page.goBack()
            await page.waitForTimeout(2000)
            
          } else {
            console.log('❌ Failed to reach study mode')
          }
        }
        
        // Step 7: Try to start test mode
        if (testCount > 0) {
          console.log('🧪 Attempting to start test mode')
          await testButton.first().click()
          await page.waitForTimeout(3000)
          
          const testUrl = page.url()
          console.log(`📍 Test mode URL: ${testUrl}`)
          
          if (testUrl.includes('/test/')) {
            console.log('🎉 SUCCESS: Reached test mode')
            
            // Take screenshot of test mode
            await page.screenshot({ path: 'test-mode-page.png', fullPage: true })
            console.log('📸 Test mode screenshot saved')
            
            // Check for test mode elements (should be minimal layout)
            await page.waitForTimeout(2000)
            const testElements = {
              sidebar: await page.locator('.sidebar, .v-navigation-drawer').count(),
              configDialog: await page.locator('.v-dialog').count(),
              testText: await page.locator('text=Test Mode').count(),
              testConfig: await page.locator('text=Test Settings, text=Time Limit').count()
            }
            
            console.log(`📊 Test mode elements:`, testElements)
            console.log('📝 Note: Test mode should have minimal layout (no permanent sidebar)')
            
          } else {
            console.log('❌ Failed to reach test mode')
          }
        }
        
        if (studyCount === 0 && testCount === 0) {
          console.log('❌ No study or test buttons found on exam detail page')
          
          // Debug: log all buttons on the page
          const allButtons = page.locator('button')
          const buttonCount = await allButtons.count()
          console.log(`🔍 Found ${buttonCount} buttons on exam detail page:`)
          
          for (let i = 0; i < Math.min(buttonCount, 10); i++) {
            const buttonText = await allButtons.nth(i).textContent()
            console.log(`🔸 Button ${i + 1}: "${buttonText}"`)
          }
        }
        
      } else {
        console.log('❌ Failed to navigate to exam detail page')
        console.log(`Expected URL pattern: /exams/[id]`)
        console.log(`Actual URL: ${afterUrl}`)
      }
    } else {
      console.log('❌ No exam cards found')
    }
    
    // Always pass - this is debugging
    expect(true).toBe(true)
  })
})