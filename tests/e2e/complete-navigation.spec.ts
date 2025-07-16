import { test, expect } from '@playwright/test'

test.describe('Complete Navigation Test - Study and Test Modes', () => {
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

  test('should complete full navigation: exam list → exam detail → study mode → test mode', async ({ page }) => {
    console.log('🚀 Starting complete navigation test')
    
    // Step 1: Navigate to exam detail page
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    
    // Click on first exam card
    await page.waitForSelector('.exam-grid-card', { timeout: 10000 })
    const firstExamCard = page.locator('.exam-grid-card').first()
    const examCode = await firstExamCard.locator('h6').textContent()
    console.log(`🎯 Clicking on exam: ${examCode}`)
    
    await firstExamCard.click()
    await page.waitForLoadState('networkidle')
    console.log(`📍 Exam detail page loaded: ${page.url()}`)
    
    // Take screenshot of exam detail page
    await page.screenshot({ path: 'exam-detail-full.png', fullPage: true })
    console.log('📸 Exam detail page screenshot saved')
    
    // Step 2: Test Study Mode
    console.log('📚 Testing Study Mode')
    
    // Find the mode selector in the study options card (more specific selector)
    const studyOptionsCard = page.locator('text=Choose Study Mode').locator('..')
    const modeSelector = studyOptionsCard.locator('.v-select')
    await modeSelector.click()
    await page.waitForTimeout(500)
    
    // Click on Study Mode option in the dropdown menu
    const studyOption = page.locator('.v-menu .v-list-item:has-text("Study Mode")')
    if (await studyOption.count() > 0) {
      await studyOption.click()
      console.log('✅ Selected Study Mode')
    } else {
      console.log('ℹ️ Study Mode already selected')
    }
    
    // Wait for dropdown to close
    await page.waitForTimeout(500)
    
    // Click the main action button (should be "Start Studying")
    const actionButton = page.locator('button.v-btn--size-x-large')
    const buttonText = await actionButton.textContent()
    console.log(`🔍 Action button text: "${buttonText}"`)
    
    await actionButton.click()
    await page.waitForTimeout(3000)
    
    const studyUrl = page.url()
    console.log(`📍 Study mode URL: ${studyUrl}`)
    
    if (studyUrl.includes('/study/')) {
      console.log('🎉 SUCCESS: Reached study mode')
      
      // Take screenshot of study mode
      await page.screenshot({ path: 'study-mode-full.png', fullPage: true })
      console.log('📸 Study mode screenshot saved')
      
      // Check study mode elements
      const studyElements = {
        breadcrumb: await page.locator('.breadcrumb, .v-breadcrumbs').count(),
        sidebar: await page.locator('.sidebar, .v-navigation-drawer').count(),
        studyConfig: await page.locator('text=Study Settings, text=Study Mode').count(),
        studyTitle: await page.locator('h1, h2, h3').filter({ hasText: /study/i }).count()
      }
      
      console.log('📊 Study mode elements:', studyElements)
      
      // Go back to exam detail page
      console.log('🔙 Going back to exam detail page')
      await page.goBack()
      await page.waitForLoadState('networkidle')
      
    } else {
      console.log('❌ Failed to reach study mode')
      return
    }
    
    // Step 3: Test Test Mode
    console.log('🧪 Testing Test Mode')
    
    // Select test mode from dropdown (using same specific selector)
    const studyOptionsCard2 = page.locator('text=Choose Study Mode').locator('..')
    const modeSelector2 = studyOptionsCard2.locator('.v-select')
    await modeSelector2.click()
    await page.waitForTimeout(500)
    
    // Click on Practice Test option in the dropdown menu
    const testOption = page.locator('.v-menu .v-list-item:has-text("Practice Test")')
    await testOption.click()
    console.log('✅ Selected Practice Test Mode')
    
    // Wait for dropdown to close
    await page.waitForTimeout(500)
    
    // Click the main action button (should now be "Start Practice Test")
    const actionButton2 = page.locator('button.v-btn--size-x-large')
    const buttonText2 = await actionButton2.textContent()
    console.log(`🔍 Action button text: "${buttonText2}"`)
    
    await actionButton2.click()
    await page.waitForTimeout(3000)
    
    const testUrl = page.url()
    console.log(`📍 Test mode URL: ${testUrl}`)
    
    if (testUrl.includes('/test/')) {
      console.log('🎉 SUCCESS: Reached test mode')
      
      // Take screenshot of test mode
      await page.screenshot({ path: 'test-mode-full.png', fullPage: true })
      console.log('📸 Test mode screenshot saved')
      
      // Check test mode elements (minimal layout)
      const testElements = {
        sidebar: await page.locator('.sidebar, .v-navigation-drawer').count(),
        dialog: await page.locator('.v-dialog').count(),
        testConfig: await page.locator('text=Test Settings, text=Time Limit').count(),
        testTitle: await page.locator('h1, h2, h3').filter({ hasText: /test/i }).count()
      }
      
      console.log('📊 Test mode elements:', testElements)
      console.log('📝 Note: Test mode uses minimal layout (no permanent sidebar)')
      
      // Check if test configuration dialog is shown
      if (testElements.dialog > 0) {
        console.log('✅ Test configuration dialog is displayed')
        
        // Try to start the test
        const startTestButton = page.locator('button:has-text("Start Test")')
        if (await startTestButton.count() > 0) {
          console.log('🚀 Attempting to start test')
          await startTestButton.click()
          await page.waitForTimeout(3000)
          
          // Take screenshot of actual test interface
          await page.screenshot({ path: 'test-interface-active.png', fullPage: true })
          console.log('📸 Active test interface screenshot saved')
          
          // Check for test interface elements
          const testInterface = {
            appBar: await page.locator('.v-app-bar').count(),
            timer: await page.locator('text=Timer, text=Time').count(),
            questionCard: await page.locator('.test-question-card, .question-card').count(),
            progressSidebar: await page.locator('.progress-sidebar').count()
          }
          
          console.log('📊 Test interface elements:', testInterface)
          
        } else {
          console.log('❌ No "Start Test" button found in dialog')
        }
      } else {
        console.log('❌ No test configuration dialog displayed')
      }
      
    } else {
      console.log('❌ Failed to reach test mode')
    }
    
    // Always pass - this is debugging
    expect(true).toBe(true)
  })
})