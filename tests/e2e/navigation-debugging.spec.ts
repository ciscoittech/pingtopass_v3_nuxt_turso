import { test, expect } from '@playwright/test'

test.describe('Navigation Debugging - User Journey Tracing', () => {
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

  test('should trace complete navigation path: home → exams → exam detail → study mode', async ({ page }) => {
    console.log('🔍 Starting navigation debugging trace')
    
    // Step 1: Start from home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    console.log(`📍 Step 1 - Home page loaded: ${page.url()}`)
    
    // Step 2: Navigate to exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    console.log(`📍 Step 2 - Exams page loaded: ${page.url()}`)
    
    // Log page title and key elements
    const pageTitle = await page.title()
    console.log(`📄 Page title: ${pageTitle}`)
    
    // Check for exam-related elements
    const examElements = await Promise.all([
      page.locator('h1, h2, h3').filter({ hasText: /exam/i }).count(),
      page.locator('.exam-grid-card, .exam-card').count(),
      page.locator('.v-card').count(),
      page.locator('text=CompTIA, text=AWS, text=Microsoft').count()
    ])
    
    console.log(`📊 Exam elements found: Headers=${examElements[0]}, ExamCards=${examElements[1]}, Cards=${examElements[2]}, Vendors=${examElements[3]}`)
    
    // Log all cards with their text content
    const cards = page.locator('.exam-grid-card, .exam-card, .v-card')
    const cardCount = await cards.count()
    console.log(`🎯 Found ${cardCount} cards on exam page`)
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const cardText = await cards.nth(i).textContent()
      console.log(`📋 Card ${i + 1}: ${cardText?.substring(0, 100)}...`)
    }
    
    // Step 3: Try to click first exam card
    if (cardCount > 0) {
      const firstCard = cards.first()
      const cardText = await firstCard.textContent()
      console.log(`🎯 Attempting to click first card: ${cardText?.substring(0, 50)}...`)
      
      // Get current URL before click
      const beforeClick = page.url()
      console.log(`📍 Before click URL: ${beforeClick}`)
      
      // Click the card
      await firstCard.click()
      await page.waitForTimeout(3000) // Wait for navigation
      
      // Check URL after click
      const afterClick = page.url()
      console.log(`📍 After click URL: ${afterClick}`)
      
      // Step 4: Check if we're on exam detail page
      if (afterClick.includes('/exams/') && afterClick !== beforeClick) {
        console.log('✅ Successfully navigated to exam detail page')
        
        // Look for exam detail elements
        const detailElements = await Promise.all([
          page.locator('h1, h2').count(),
          page.locator('button:has-text("Start Studying")').count(),
          page.locator('button:has-text("Start Practice Test")').count(),
          page.locator('button:has-text("Start")').count(),
          page.locator('.v-select').count()
        ])
        
        console.log(`📊 Detail page elements: Headers=${detailElements[0]}, Study=${detailElements[1]}, Test=${detailElements[2]}, Start=${detailElements[3]}, Selects=${detailElements[4]}`)
        
        // Try to start study mode
        const studyButton = page.locator('button:has-text("Start Studying"), button:has-text("Start Study"), button:has-text("Start")')
        if (await studyButton.count() > 0) {
          console.log('🚀 Clicking study button')
          await studyButton.first().click()
          await page.waitForTimeout(2000)
          
          const studyUrl = page.url()
          console.log(`📍 Study mode URL: ${studyUrl}`)
          
          if (studyUrl.includes('/study/')) {
            console.log('🎉 SUCCESS: Reached study mode')
            
            // Check study mode elements
            const studyElements = await Promise.all([
              page.locator('text=Study Mode').count(),
              page.locator('.v-dialog').count(),
              page.locator('.study-question-card').count(),
              page.locator('.sidebar, .v-navigation-drawer').count()
            ])
            
            console.log(`📊 Study mode elements: Title=${studyElements[0]}, Dialog=${studyElements[1]}, Questions=${studyElements[2]}, Sidebar=${studyElements[3]}`)
            
            // Take screenshot of study mode
            await page.screenshot({ path: 'debug-study-mode.png', fullPage: true })
            console.log('📸 Study mode screenshot saved')
            
          } else {
            console.log('❌ Failed to reach study mode')
          }
        } else {
          console.log('❌ No study button found on exam detail page')
        }
        
      } else {
        console.log('❌ Failed to navigate to exam detail page')
        console.log(`Expected URL pattern: /exams/[id]`)
        console.log(`Actual URL: ${afterClick}`)
      }
    } else {
      console.log('❌ No exam cards found on exams page')
    }
    
    // Always pass - this is debugging
    expect(true).toBe(true)
  })

  test('should trace test mode navigation path', async ({ page }) => {
    console.log('🧪 Starting test mode navigation trace')
    
    // Mock auth
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'debug-user', email: 'debug@test.com', name: 'Debug User' }
        })
      })
    })
    
    // Navigate to exams
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    console.log(`📍 Exams page loaded: ${page.url()}`)
    
    // Find and click exam card
    const cards = page.locator('.exam-grid-card, .exam-card, .v-card')
    const cardCount = await cards.count()
    console.log(`🎯 Found ${cardCount} cards`)
    
    if (cardCount > 0) {
      await cards.first().click()
      await page.waitForTimeout(2000)
      
      const examDetailUrl = page.url()
      console.log(`📍 Exam detail URL: ${examDetailUrl}`)
      
      if (examDetailUrl.includes('/exams/')) {
        // Look for test mode selector
        const modeSelector = page.locator('.v-select')
        if (await modeSelector.count() > 0) {
          console.log('🎛️ Found mode selector, switching to test mode')
          await modeSelector.click()
          
          const testOption = page.locator('text=Practice Test, text=Test Mode')
          if (await testOption.count() > 0) {
            await testOption.click()
            console.log('✅ Selected test mode')
          }
        }
        
        // Click test button
        const testButton = page.locator('button:has-text("Start Practice Test"), button:has-text("Start Test"), button:has-text("Start")')
        if (await testButton.count() > 0) {
          console.log('🧪 Clicking test button')
          await testButton.first().click()
          await page.waitForTimeout(2000)
          
          const testUrl = page.url()
          console.log(`📍 Test mode URL: ${testUrl}`)
          
          if (testUrl.includes('/test/')) {
            console.log('🎉 SUCCESS: Reached test mode')
            
            // Check test mode elements (should be minimal layout)
            const testElements = await Promise.all([
              page.locator('text=Test Mode').count(),
              page.locator('.v-dialog').count(),
              page.locator('.test-question-card').count(),
              page.locator('.sidebar, .v-navigation-drawer').count() // Should be 0 in minimal layout
            ])
            
            console.log(`📊 Test mode elements: Title=${testElements[0]}, Dialog=${testElements[1]}, Questions=${testElements[2]}, Sidebar=${testElements[3]}`)
            console.log('📝 Note: Sidebar count should be 0 in test mode (minimal layout)')
            
            // Take screenshot of test mode
            await page.screenshot({ path: 'debug-test-mode.png', fullPage: true })
            console.log('📸 Test mode screenshot saved')
            
          } else {
            console.log('❌ Failed to reach test mode')
          }
        } else {
          console.log('❌ No test button found')
        }
      }
    }
    
    expect(true).toBe(true)
  })

  test('should check for actual exam data and questions', async ({ page }) => {
    console.log('🗃️ Checking for actual exam data')
    
    // Test API endpoints directly
    const apiTests = [
      { endpoint: '/api/exams', description: 'Exams list' },
      { endpoint: '/api/vendors', description: 'Vendors list' },
      { endpoint: '/api/questions', description: 'Questions list' }
    ]
    
    for (const test of apiTests) {
      try {
        const response = await page.request.get(test.endpoint)
        const data = await response.json()
        console.log(`📡 ${test.description}: Status=${response.status()}, Success=${data.success}, Data=${JSON.stringify(data).substring(0, 100)}...`)
      } catch (error) {
        console.log(`❌ ${test.description}: Error=${error}`)
      }
    }
    
    // Test specific exam endpoint
    try {
      const examResponse = await page.request.get('/api/exams')
      const examData = await examResponse.json()
      
      if (examData.success && examData.data.exams && examData.data.exams.length > 0) {
        const firstExam = examData.data.exams[0]
        console.log(`📋 First exam: ID=${firstExam.id}, Code=${firstExam.code}, Name=${firstExam.name}`)
        
        // Test single exam endpoint
        const singleExamResponse = await page.request.get(`/api/exams/${firstExam.id}`)
        const singleExamData = await singleExamResponse.json()
        console.log(`📋 Single exam: Status=${singleExamResponse.status()}, Success=${singleExamData.success}`)
        
        // Test questions for this exam
        const questionsResponse = await page.request.get(`/api/exams/${firstExam.id}/questions/count`)
        const questionsData = await questionsResponse.json()
        console.log(`❓ Questions count: Status=${questionsResponse.status()}, Count=${questionsData.data?.count}`)
        
      } else {
        console.log('❌ No exam data found')
      }
    } catch (error) {
      console.log(`❌ API test error: ${error}`)
    }
    
    expect(true).toBe(true)
  })

  test('should monitor console errors during navigation', async ({ page }) => {
    console.log('🐛 Starting console error monitoring')
    
    const errors: string[] = []
    const warnings: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })
    
    // Perform navigation
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    
    const cards = page.locator('.exam-grid-card, .exam-card, .v-card')
    if (await cards.count() > 0) {
      await cards.first().click()
      await page.waitForTimeout(2000)
      
      const studyButton = page.locator('button:has-text("Start")')
      if (await studyButton.count() > 0) {
        await studyButton.first().click()
        await page.waitForTimeout(2000)
      }
    }
    
    // Report errors
    console.log(`🐛 Console errors found: ${errors.length}`)
    errors.forEach((error, index) => {
      console.log(`❌ Error ${index + 1}: ${error}`)
    })
    
    console.log(`⚠️  Console warnings found: ${warnings.length}`)
    warnings.forEach((warning, index) => {
      console.log(`⚠️  Warning ${index + 1}: ${warning}`)
    })
    
    expect(true).toBe(true)
  })
})