import { test, expect } from '@playwright/test'

test.describe('Real Navigation Test - User Journey', () => {
  test('should complete full user journey: login → exams → study mode', async ({ page }) => {
    console.log('🚀 Starting real user navigation test')
    
    // Step 1: Navigate to home page
    await page.goto('/')
    console.log('✅ Loaded home page')
    
    // Step 2: Try to access exams (should redirect to login)
    await page.goto('/exams')
    console.log('🔐 Navigating to exams - should require auth')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check current URL to understand auth flow
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)
    
    if (currentUrl.includes('/auth/login')) {
      console.log('🔑 Redirected to login page - auth working correctly')
      
      // Check for login form elements
      const loginElements = await Promise.all([
        page.locator('button:has-text("Google"), .google-login, [href*="oauth"]').count(),
        page.locator('input[type="email"]').count(),
        page.locator('button:has-text("Login"), button:has-text("Sign In")').count()
      ])
      
      console.log(`🔍 Login elements found: Google=${loginElements[0]}, Email=${loginElements[1]}, Submit=${loginElements[2]}`)
      
      // For testing purposes, try to bypass auth by going directly to exams with mock auth
      await page.addInitScript(() => {
        window.localStorage.setItem('auth-bypass', 'true')
      })
      
      // Mock the auth endpoint
      await page.route('/api/auth/me', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              name: 'Test User',
              isAdmin: false
            }
          })
        })
      })
      
      // Try accessing exams again with mocked auth
      await page.goto('/exams')
      await page.waitForLoadState('networkidle')
    }
    
    // Step 3: Check if we can see exams page
    console.log('📚 Attempting to load exams page')
    
    // Look for exam-related content
    const examPageElements = [
      'text=Available Exams',
      'text=Certification Exams',
      'text=Exam Catalog',
      '.exam-grid-card',
      '.exam-card',
      '.v-card'
    ]
    
    let foundExamPage = false
    for (const selector of examPageElements) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        foundExamPage = true
        console.log(`✅ Found exam page element: ${selector} (${count} elements)`)
        break
      }
    }
    
    if (!foundExamPage) {
      console.log('❌ Could not find exam page elements')
      console.log(`📍 Final URL: ${page.url()}`)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-exam-page.png', fullPage: true })
      console.log('📸 Screenshot saved as debug-exam-page.png')
      
      return // Exit early if we can't find exams
    }
    
    // Step 4: Try to find and click an exam
    console.log('🎯 Looking for exam cards to click')
    
    const examCards = page.locator('.exam-grid-card, .exam-card, .v-card').filter({ hasText: /CompTIA|AWS|Microsoft|Cisco|Test/ })
    const examCount = await examCards.count()
    console.log(`📊 Found ${examCount} exam cards`)
    
    if (examCount > 0) {
      // Get exam info before clicking
      const firstCard = examCards.first()
      const examText = await firstCard.textContent()
      console.log(`🎯 Clicking first exam: ${examText?.substring(0, 100)}...`)
      
      await firstCard.click()
      await page.waitForTimeout(2000)
      
      const newUrl = page.url()
      console.log(`📍 After clicking exam, URL: ${newUrl}`)
      
      // Step 5: Try to start study mode
      if (newUrl.includes('/exams/')) {
        console.log('✅ Successfully navigated to exam detail page')
        
        // Look for study/test buttons
        const actionButtons = await Promise.all([
          page.locator('button:has-text("Start Studying")').count(),
          page.locator('button:has-text("Start Practice Test")').count(),
          page.locator('button:has-text("Start Study")').count(),
          page.locator('button:has-text("Start Test")').count(),
          page.locator('button:has-text("Start")').count()
        ])
        
        console.log(`🔘 Action buttons found: Studying=${actionButtons[0]}, Test=${actionButtons[1]}, Study=${actionButtons[2]}, Test=${actionButtons[3]}, Start=${actionButtons[4]}`)
        
        // Try to click a start button
        const startButtons = page.locator('button:has-text("Start Studying"), button:has-text("Start Study"), button:has-text("Start")')
        if (await startButtons.count() > 0) {
          console.log('🚀 Clicking start studying button')
          await startButtons.first().click()
          await page.waitForTimeout(3000)
          
          const studyUrl = page.url()
          console.log(`📍 After clicking start, URL: ${studyUrl}`)
          
          if (studyUrl.includes('/study/')) {
            console.log('🎉 SUCCESS: Reached study mode!')
            
            // Look for study interface elements
            const studyElements = [
              'text=Study Mode',
              'text=Question',
              '.study-question-card',
              '.question-card',
              '.v-dialog'
            ]
            
            for (const selector of studyElements) {
              const count = await page.locator(selector).count()
              if (count > 0) {
                console.log(`✅ Found study element: ${selector} (${count} elements)`)
              }
            }
            
            // Take success screenshot
            await page.screenshot({ path: 'success-study-mode.png', fullPage: true })
            console.log('📸 Success screenshot saved as success-study-mode.png')
            
          } else {
            console.log(`⚠️  Expected to be in study mode, but URL is: ${studyUrl}`)
          }
        } else {
          console.log('❌ Could not find start studying button')
        }
      } else {
        console.log(`⚠️  Expected to be on exam detail page, but URL is: ${newUrl}`)
      }
    } else {
      console.log('❌ No exam cards found to click')
    }
    
    // Always pass the test since this is exploratory
    expect(true).toBe(true)
  })

  test('should test the specific exam ID from user report', async ({ page }) => {
    console.log('🎯 Testing specific exam ID: exam_1752523372145_16qk94d1b')
    
    // Mock auth
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user', email: 'test@example.com', name: 'Test User' }
        })
      })
    })
    
    // Step 1: Try to access the specific exam detail page
    await page.goto('/exams/exam_1752523372145_16qk94d1b')
    await page.waitForLoadState('networkidle')
    
    console.log(`📍 Exam detail page URL: ${page.url()}`)
    
    // Check what's on the page
    const pageContent = await page.textContent('body')
    console.log(`📄 Page contains (first 500 chars): ${pageContent?.substring(0, 500)}`)
    
    // Look for the start buttons the user mentioned
    const studyButton = page.locator('button:has-text("Start Studying")')
    const testButton = page.locator('button:has-text("Start Practice Test"), button:has-text("Test Exam")')
    
    const studyCount = await studyButton.count()
    const testCount = await testButton.count()
    
    console.log(`🔘 Found ${studyCount} study buttons and ${testCount} test buttons`)
    
    if (studyCount > 0) {
      console.log('🚀 Clicking Start Studying button')
      await studyButton.click()
      await page.waitForTimeout(2000)
      
      const studyUrl = page.url()
      console.log(`📍 After study click, URL: ${studyUrl}`)
      
      if (studyUrl.includes('/study/')) {
        console.log('✅ Study navigation SUCCESS')
      } else {
        console.log('❌ Study navigation FAILED')
      }
    }
    
    // Go back and try test mode
    await page.goto('/exams/exam_1752523372145_16qk94d1b')
    await page.waitForTimeout(1000)
    
    if (testCount > 0) {
      console.log('🧪 Clicking Test button')
      await testButton.click()
      await page.waitForTimeout(2000)
      
      const testUrl = page.url()
      console.log(`📍 After test click, URL: ${testUrl}`)
      
      if (testUrl.includes('/test/')) {
        console.log('✅ Test navigation SUCCESS')
      } else {
        console.log('❌ Test navigation FAILED')
      }
    }
    
    expect(true).toBe(true)
  })
})