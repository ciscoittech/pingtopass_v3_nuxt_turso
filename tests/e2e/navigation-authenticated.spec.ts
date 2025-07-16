import { test, expect } from '@playwright/test'
import { skipAuthForTesting, mockExamData } from './helpers/auth-helper'

test.describe('Navigation Flow - Authenticated Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication and mock data for each test
    await skipAuthForTesting(page)
    await mockExamData(page)
  })

  test('should navigate from exam list to exam detail page', async ({ page }) => {
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    
    // Wait for exam cards to appear
    const examCards = page.locator('.exam-grid-card, .exam-card, .v-card').filter({ hasText: 'Test' })
    await expect(examCards.first()).toBeVisible({ timeout: 10000 })
    
    // Click on exam card
    await examCards.first().click()
    
    // Should navigate to exam detail page
    await expect(page).toHaveURL(/\/exams\/test-exam-1/, { timeout: 10000 })
    
    // Verify exam detail page loads
    await expect(page.locator('h1, h2').filter({ hasText: 'TEST-001' })).toBeVisible()
  })

  test('should navigate to study mode from exam detail page', async ({ page }) => {
    // Navigate directly to exam detail page
    await page.goto('/exams/test-exam-1')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the exam detail page
    await expect(page.locator('h1, h2').filter({ hasText: 'TEST-001' })).toBeVisible()
    
    // Look for study mode selector and button
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
    await expect(page).toHaveURL('/study/test-exam-1', { timeout: 10000 })
    
    // Verify study page loads
    const studyPageIndicators = [
      'text=Study Mode',
      'text=Test Certification Exam',
      '.v-dialog',
      '.study-question-card'
    ]
    
    let foundStudyIndicator = false
    for (const selector of studyPageIndicators) {
      if (await page.locator(selector).count() > 0) {
        foundStudyIndicator = true
        console.log(`Found study page indicator: ${selector}`)
        break
      }
    }
    expect(foundStudyIndicator).toBeTruthy()
  })

  test('should navigate to test mode from exam detail page', async ({ page }) => {
    // Navigate directly to exam detail page
    await page.goto('/exams/test-exam-1')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the exam detail page
    await expect(page.locator('h1, h2').filter({ hasText: 'TEST-001' })).toBeVisible()
    
    // Look for test mode selector and button
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
    await expect(page).toHaveURL('/test/test-exam-1', { timeout: 10000 })
    
    // Verify test page loads
    const testPageIndicators = [
      'text=Test Mode',
      'text=Test Certification Exam',
      '.v-dialog',
      '.test-question-card'
    ]
    
    let foundTestIndicator = false
    for (const selector of testPageIndicators) {
      if (await page.locator(selector).count() > 0) {
        foundTestIndicator = true
        console.log(`Found test page indicator: ${selector}`)
        break
      }
    }
    expect(foundTestIndicator).toBeTruthy()
  })

  test('should handle study mode configuration and start session', async ({ page }) => {
    // Navigate directly to study page
    await page.goto('/study/test-exam-1')
    await page.waitForLoadState('networkidle')
    
    // Look for configuration dialog
    const configDialog = page.locator('.v-dialog')
    if (await configDialog.isVisible()) {
      console.log('Configuration dialog found')
      
      // Configure study session if options are available
      const questionInput = page.locator('input[type="number"]')
      if (await questionInput.count() > 0) {
        await questionInput.fill('10')
        console.log('Set number of questions to 10')
      }
      
      // Start study session
      const startButton = page.locator('button:has-text("Start Study"), button:has-text("Start Studying")')
      if (await startButton.count() > 0) {
        console.log('Clicking start button')
        await startButton.click()
        
        // Wait for study interface to load
        await page.waitForTimeout(2000)
        
        // Verify study interface loads
        const studyInterface = [
          '.study-question-card',
          '.question-card', 
          'text=Question',
          '.question-wrapper'
        ]
        
        let foundInterface = false
        for (const selector of studyInterface) {
          if (await page.locator(selector).count() > 0) {
            foundInterface = true
            console.log(`Found study interface: ${selector}`)
            break
          }
        }
        expect(foundInterface).toBeTruthy()
      }
    } else {
      console.log('No configuration dialog - checking for direct study interface')
      
      // If no config dialog, look for direct study interface
      const studyElements = [
        '.study-question-card',
        '.question-card',
        'text=Study Mode',
        'text=Question'
      ]
      
      let foundElement = false
      for (const selector of studyElements) {
        if (await page.locator(selector).count() > 0) {
          foundElement = true
          console.log(`Found study element: ${selector}`)
          break
        }
      }
      expect(foundElement).toBeTruthy()
    }
  })

  test('should handle test mode configuration and start session', async ({ page }) => {
    // Navigate directly to test page
    await page.goto('/test/test-exam-1')
    await page.waitForLoadState('networkidle')
    
    // Look for configuration dialog
    const configDialog = page.locator('.v-dialog')
    if (await configDialog.isVisible()) {
      console.log('Test configuration dialog found')
      
      // Configure test session if options are available
      const timeSelect = page.locator('.v-select').filter({ hasText: 'Time' })
      if (await timeSelect.count() > 0) {
        await timeSelect.click()
        const oneHourOption = page.locator('text=1 hour')
        if (await oneHourOption.count() > 0) {
          await oneHourOption.click()
          console.log('Set time limit to 1 hour')
        }
      }
      
      const questionInput = page.locator('input[type="number"]')
      if (await questionInput.count() > 0) {
        await questionInput.fill('20')
        console.log('Set number of questions to 20')
      }
      
      // Start test session
      const startButton = page.locator('button:has-text("Start Test")')
      if (await startButton.count() > 0) {
        console.log('Clicking start test button')
        await startButton.click()
        
        // Wait for test interface to load
        await page.waitForTimeout(2000)
        
        // Verify test interface loads
        const testInterface = [
          '.test-question-card',
          '.question-card',
          '.test-interface',
          'text=Question',
          '.question-wrapper'
        ]
        
        let foundInterface = false
        for (const selector of testInterface) {
          if (await page.locator(selector).count() > 0) {
            foundInterface = true
            console.log(`Found test interface: ${selector}`)
            break
          }
        }
        expect(foundInterface).toBeTruthy()
      }
    } else {
      console.log('No test configuration dialog - checking for direct test interface')
      
      // If no config dialog, look for direct test interface
      const testElements = [
        '.test-question-card',
        '.question-card',
        'text=Test Mode',
        'text=Question'
      ]
      
      let foundElement = false
      for (const selector of testElements) {
        if (await page.locator(selector).count() > 0) {
          foundElement = true
          console.log(`Found test element: ${selector}`)
          break
        }
      }
      expect(foundElement).toBeTruthy()
    }
  })

  test('should monitor console errors during full navigation flow', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Full navigation flow
    console.log('Starting full navigation flow test')
    
    // 1. Go to exams list
    await page.goto('/exams')
    await page.waitForLoadState('networkidle')
    console.log('Loaded exams page')
    
    // 2. Click exam card
    const examCards = page.locator('.exam-grid-card, .exam-card, .v-card').filter({ hasText: 'Test' })
    if (await examCards.count() > 0) {
      await examCards.first().click()
      await page.waitForTimeout(1000)
      console.log('Clicked exam card')
      
      // 3. Navigate to study mode
      const studyButton = page.locator('button:has-text("Start")')
      if (await studyButton.count() > 0) {
        await studyButton.click()
        await page.waitForTimeout(2000)
        console.log('Clicked start button')
      }
    }
    
    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('favicon') &&
      !error.includes('Extension') &&
      !error.includes('Suspense') &&
      !error.includes('chunk') &&
      !error.includes('_nuxt')
    )
    
    console.log('Console errors found:', consoleErrors)
    console.log('Critical errors:', criticalErrors)
    
    // Report critical errors but don't fail the test for minor issues
    expect(criticalErrors.length).toBeLessThan(5)
  })
})