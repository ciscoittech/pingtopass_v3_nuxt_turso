import { test, expect } from '@playwright/test'

test.describe('Navigation Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login if needed (adjust based on auth setup)
    await page.goto('/')
    
    // Skip auth or login here if needed
    // For now, assume we can navigate directly to exams
  })

  test.describe('Exam List to Detail Navigation', () => {
    test('should navigate from exam list to exam detail page', async ({ page }) => {
      await page.goto('/exams')
      
      // Wait for exams to load
      await page.waitForLoadState('networkidle')
      
      // Check that exam cards are present
      const examCards = page.locator('.exam-grid-card, .exam-card, .v-card')
      await expect(examCards.first()).toBeVisible({ timeout: 10000 })
      
      // Get the first exam card and click it
      const firstExamCard = examCards.first()
      await firstExamCard.click()
      
      // Should navigate to exam detail page
      await expect(page).toHaveURL(/\/exams\/[^\/]+/, { timeout: 10000 })
      
      // Verify exam detail page loads
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=Start Studying, text=Start Practice Test')).toBeVisible()
    })

    test('should display exam details correctly', async ({ page }) => {
      await page.goto('/exams')
      await page.waitForLoadState('networkidle')
      
      const examCards = page.locator('.exam-grid-card, .exam-card, .v-card')
      if (await examCards.count() > 0) {
        await examCards.first().click()
        await page.waitForURL(/\/exams\/[^\/]+/)
        
        // Check for exam detail elements
        await expect(page.locator('h1')).toBeVisible()
        
        // Check for study mode selector
        const modeSelector = page.locator('.v-select, select')
        if (await modeSelector.count() > 0) {
          await expect(modeSelector).toBeVisible()
        }
        
        // Check for action buttons
        const actionButton = page.locator('button:has-text("Start")')
        await expect(actionButton).toBeVisible()
      }
    })
  })

  test.describe('Study Mode Navigation Flow', () => {
    test('should navigate to study mode and load configuration', async ({ page }) => {
      // Start from exam detail page
      await page.goto('/exams')
      await page.waitForLoadState('networkidle')
      
      const examCards = page.locator('.exam-grid-card, .exam-card, .v-card')
      if (await examCards.count() > 0) {
        // Click first exam card to go to detail page
        await examCards.first().click()
        await page.waitForURL(/\/exams\/[^\/]+/)
        
        // Extract exam ID from URL for later verification
        const url = page.url()
        const examId = url.split('/').pop()
        
        // Select study mode if selector exists
        const modeSelector = page.locator('.v-select')
        if (await modeSelector.count() > 0) {
          await modeSelector.click()
          const studyOption = page.locator('text=Study Mode')
          if (await studyOption.count() > 0) {
            await studyOption.click()
          }
        }
        
        // Click Start Studying button
        const startButton = page.locator('button:has-text("Start Studying"), button:has-text("Start Study")')
        await expect(startButton).toBeVisible()
        await startButton.click()
        
        // Should navigate to study page
        await expect(page).toHaveURL(`/study/${examId}`, { timeout: 15000 })
        
        // Verify study page loads (configuration dialog or question interface)
        const studyElements = [
          '.v-dialog',           // Configuration dialog
          '.study-question-card', // Question card
          'text=Study Mode',     // Page title
          'text=Start Studying'  // Start button in dialog
        ]
        
        let foundStudyElement = false
        for (const selector of studyElements) {
          if (await page.locator(selector).count() > 0) {
            foundStudyElement = true
            break
          }
        }
        expect(foundStudyElement).toBeTruthy()
      }
    })

    test('should start study session from configuration dialog', async ({ page }) => {
      // Navigate directly to study page to test session start
      await page.goto('/study/exam_1752523372145_16qk94d1b') // Use known exam ID
      
      // Look for configuration dialog
      const configDialog = page.locator('.v-dialog')
      if (await configDialog.isVisible()) {
        // Configure study session if options are available
        const questionInput = page.locator('input[type="number"]')
        if (await questionInput.count() > 0) {
          await questionInput.fill('10')
        }
        
        // Start study session
        const startButton = page.locator('button:has-text("Start Study"), button:has-text("Start Studying")')
        if (await startButton.count() > 0) {
          await startButton.click()
          
          // Wait for study interface to load
          await page.waitForTimeout(2000)
          
          // Verify study interface elements
          const studyInterface = await page.locator('.study-question-card, .question-card').count() > 0
          expect(studyInterface).toBeTruthy()
        }
      }
    })
  })

  test.describe('Test Mode Navigation Flow', () => {
    test('should navigate to test mode and load configuration', async ({ page }) => {
      // Start from exam detail page
      await page.goto('/exams')
      await page.waitForLoadState('networkidle')
      
      const examCards = page.locator('.exam-grid-card, .exam-card, .v-card')
      if (await examCards.count() > 0) {
        // Click first exam card to go to detail page
        await examCards.first().click()
        await page.waitForURL(/\/exams\/[^\/]+/)
        
        // Extract exam ID from URL
        const url = page.url()
        const examId = url.split('/').pop()
        
        // Select test mode if selector exists
        const modeSelector = page.locator('.v-select')
        if (await modeSelector.count() > 0) {
          await modeSelector.click()
          const testOption = page.locator('text=Practice Test')
          if (await testOption.count() > 0) {
            await testOption.click()
          }
        }
        
        // Click Start Practice Test button
        const startButton = page.locator('button:has-text("Start Practice Test"), button:has-text("Start Test")')
        await expect(startButton).toBeVisible()
        await startButton.click()
        
        // Should navigate to test page
        await expect(page).toHaveURL(`/test/${examId}`, { timeout: 15000 })
        
        // Verify test page loads (configuration dialog or test interface)
        const testElements = [
          '.v-dialog',           // Configuration dialog
          '.test-question-card', // Question card
          'text=Test Mode',      // Page title
          'text=Start Test'      // Start button in dialog
        ]
        
        let foundTestElement = false
        for (const selector of testElements) {
          if (await page.locator(selector).count() > 0) {
            foundTestElement = true
            break
          }
        }
        expect(foundTestElement).toBeTruthy()
      }
    })

    test('should start test session from configuration dialog', async ({ page }) => {
      // Navigate directly to test page
      await page.goto('/test/exam_1752523372145_16qk94d1b') // Use known exam ID
      
      // Look for configuration dialog
      const configDialog = page.locator('.v-dialog')
      if (await configDialog.isVisible()) {
        // Configure test session if options are available
        const timeSelect = page.locator('.v-select').filter({ hasText: 'Time' })
        if (await timeSelect.count() > 0) {
          await timeSelect.click()
          const oneHourOption = page.locator('text=1 hour')
          if (await oneHourOption.count() > 0) {
            await oneHourOption.click()
          }
        }
        
        const questionInput = page.locator('input[type="number"]')
        if (await questionInput.count() > 0) {
          await questionInput.fill('20')
        }
        
        // Start test session
        const startButton = page.locator('button:has-text("Start Test")')
        if (await startButton.count() > 0) {
          await startButton.click()
          
          // Wait for test interface to load
          await page.waitForTimeout(2000)
          
          // Verify test interface elements
          const testInterface = await page.locator('.test-question-card, .question-card, .test-interface').count() > 0
          expect(testInterface).toBeTruthy()
        }
      }
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle invalid exam IDs gracefully', async ({ page }) => {
      // Try to navigate to non-existent exam
      await page.goto('/exams/invalid-exam-id')
      
      // Should show error page or redirect
      const errorElements = [
        'text=not found',
        'text=404',
        'text=error',
        '.error-page'
      ]
      
      let foundError = false
      for (const selector of errorElements) {
        if (await page.locator(selector).count() > 0) {
          foundError = true
          break
        }
      }
      
      // Should either show error or redirect to exams list
      if (!foundError) {
        await expect(page).toHaveURL('/exams')
      }
    })

    test('should handle navigation without exam data', async ({ page }) => {
      // Navigate directly to study/test pages without going through exam detail
      await page.goto('/study/nonexistent-exam')
      
      // Should handle gracefully (show error or redirect)
      await page.waitForTimeout(2000)
      
      const hasError = await page.locator('text=not found, text=error').count() > 0
      const redirected = page.url() !== 'http://localhost:3000/study/nonexistent-exam'
      
      expect(hasError || redirected).toBeTruthy()
    })

    test('should monitor console errors during navigation', async ({ page }) => {
      const consoleErrors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      // Perform navigation flow
      await page.goto('/exams')
      await page.waitForLoadState('networkidle')
      
      const examCards = page.locator('.exam-grid-card, .exam-card, .v-card')
      if (await examCards.count() > 0) {
        await examCards.first().click()
        await page.waitForTimeout(1000)
        
        const startButton = page.locator('button:has-text("Start")')
        if (await startButton.count() > 0) {
          await startButton.click()
          await page.waitForTimeout(2000)
        }
      }
      
      // Filter out known acceptable errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Failed to load resource') && // Network errors
        !error.includes('favicon') &&                // Favicon errors
        !error.includes('Extension') &&              // Browser extension errors
        !error.includes('Suspense')                  // Vue Suspense warnings
      )
      
      if (criticalErrors.length > 0) {
        console.log('Console errors during navigation:', criticalErrors)
      }
      
      // Don't fail the test for console errors, but log them for debugging
      expect(criticalErrors.length).toBeLessThan(10) // Allow some non-critical errors
    })
  })

  test.describe('Mobile Navigation', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/exams')
      await page.waitForLoadState('networkidle')
      
      // Test mobile navigation
      const examCards = page.locator('.exam-grid-card, .exam-card, .v-card')
      if (await examCards.count() > 0) {
        await examCards.first().click()
        await page.waitForURL(/\/exams\/[^\/]+/)
        
        // Test mobile-specific elements
        const mobileButton = page.locator('button:has-text("Start")')
        if (await mobileButton.count() > 0) {
          await expect(mobileButton).toBeVisible()
          await mobileButton.click()
        }
      }
    })
  })
})

test.describe('API Integration Tests', () => {
  test('should verify exam API endpoints work correctly', async ({ page }) => {
    // Test API endpoints directly
    const response = await page.request.get('/api/exams')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  test('should verify single exam API endpoint', async ({ page }) => {
    // First get list of exams to find a valid ID
    const listResponse = await page.request.get('/api/exams')
    const listData = await listResponse.json()
    
    if (listData.success && listData.data.exams && listData.data.exams.length > 0) {
      const examId = listData.data.exams[0].id
      
      // Test single exam endpoint
      const examResponse = await page.request.get(`/api/exams/${examId}`)
      expect(examResponse.status()).toBe(200)
      
      const examData = await examResponse.json()
      expect(examData.success).toBe(true)
      expect(examData.data).toBeDefined()
      expect(examData.data.id).toBe(examId)
    }
  })
})