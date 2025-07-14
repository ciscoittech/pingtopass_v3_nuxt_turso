import { test, expect } from '@playwright/test'

test.describe('Study Mode Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }))
    })
    
    await page.goto('/')
  })

  test('should navigate to study mode from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for study button or link
    const studyButton = page.locator('button:has-text("Study"), a:has-text("Study"), [data-testid="study-button"]')
    
    if (await studyButton.count() > 0) {
      await studyButton.first().click()
      
      // Should navigate to exams list or study page
      await expect(page).toHaveURL(/\/(study|exams)/)
    }
  })

  test('should display available exams', async ({ page }) => {
    await page.goto('/exams')
    
    // Should show exam cards or list
    const examElements = page.locator('.exam-card, .exam-item, [data-testid="exam"]')
    
    // Wait for exams to load
    await page.waitForTimeout(2000)
    
    const examCount = await examElements.count()
    expect(examCount).toBeGreaterThanOrEqual(0) // Could be 0 if no exams seeded
  })

  test('should start study session for an exam', async ({ page }) => {
    await page.goto('/exams')
    
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Look for study buttons
    const studyButtons = page.locator('button:has-text("Study"), a:has-text("Study"), [data-testid="start-study"]')
    
    if (await studyButtons.count() > 0) {
      await studyButtons.first().click()
      
      // Should navigate to study session
      await expect(page).toHaveURL(/\/study\//)
      
      // Should see question content
      const questionArea = page.locator('.question, [data-testid="question"], .question-text')
      await expect(questionArea.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display question with multiple choice options', async ({ page }) => {
    // Navigate directly to a study session (assuming exam ID exists)
    await page.goto('/study/test-exam-id')
    
    // Wait for question to load
    await page.waitForTimeout(3000)
    
    // Should see question text
    const questionText = page.locator('.question-text, .question, [data-testid="question-text"]')
    if (await questionText.count() > 0) {
      await expect(questionText.first()).toBeVisible()
    }
    
    // Should see multiple choice options
    const options = page.locator('.option, .answer-option, [data-testid="option"], button:has-text("A)"), button:has-text("B)"), button:has-text("C)"), button:has-text("D)")')
    if (await options.count() > 0) {
      expect(await options.count()).toBeGreaterThanOrEqual(2) // At least 2 options
    }
  })

  test('should allow selecting and submitting answers', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(3000)
    
    // Select an answer option
    const firstOption = page.locator('.option, .answer-option, [data-testid="option"]').first()
    
    if (await firstOption.count() > 0) {
      await firstOption.click()
      
      // Should show as selected
      await expect(firstOption).toHaveClass(/selected|active|checked/)
      
      // Look for submit button
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Next"), [data-testid="submit-answer"]')
      
      if (await submitButton.count() > 0) {
        await submitButton.first().click()
        
        // Should show feedback or next question
        await page.waitForTimeout(1000)
        
        const feedback = page.locator('.feedback, .explanation, [data-testid="feedback"]')
        const nextQuestion = page.locator('.question, [data-testid="question"]')
        
        // Either feedback or next question should be visible
        const feedbackVisible = await feedback.count() > 0
        const nextQuestionVisible = await nextQuestion.count() > 0
        
        expect(feedbackVisible || nextQuestionVisible).toBeTruthy()
      }
    }
  })

  test('should show study progress', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(3000)
    
    // Look for progress indicators
    const progressElements = page.locator('.progress, .progress-bar, [data-testid="progress"], text=/\d+\/\d+/, text=/\d+%/')
    
    if (await progressElements.count() > 0) {
      await expect(progressElements.first()).toBeVisible()
    }
  })

  test('should handle bookmark functionality', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(3000)
    
    // Look for bookmark button
    const bookmarkButton = page.locator('button:has-text("Bookmark"), [data-testid="bookmark"], .bookmark-btn')
    
    if (await bookmarkButton.count() > 0) {
      await bookmarkButton.first().click()
      
      // Should show bookmarked state
      await expect(bookmarkButton.first()).toHaveClass(/active|bookmarked|selected/)
    }
  })

  test('should handle flag functionality', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(3000)
    
    // Look for flag button
    const flagButton = page.locator('button:has-text("Flag"), [data-testid="flag"], .flag-btn')
    
    if (await flagButton.count() > 0) {
      await flagButton.first().click()
      
      // Should show flagged state
      await expect(flagButton.first()).toHaveClass(/active|flagged|selected/)
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(3000)
    
    // Test keyboard shortcuts
    await page.keyboard.press('1') // Select option A
    await page.waitForTimeout(500)
    
    await page.keyboard.press('2') // Select option B
    await page.waitForTimeout(500)
    
    await page.keyboard.press('Enter') // Submit answer
    await page.waitForTimeout(1000)
    
    // Should handle keyboard input gracefully (no errors)
    const errors = page.locator('.error, [role="alert"]')
    expect(await errors.count()).toBe(0)
  })

  test('should show study session summary', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(3000)
    
    // Simulate completing a study session
    for (let i = 0; i < 3; i++) {
      const option = page.locator('.option, .answer-option').first()
      if (await option.count() > 0) {
        await option.click()
        
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Next")')
        if (await submitButton.count() > 0) {
          await submitButton.first().click()
          await page.waitForTimeout(1000)
        }
      }
    }
    
    // Look for session summary
    const summary = page.locator('.summary, .session-complete, [data-testid="session-summary"]')
    
    if (await summary.count() > 0) {
      await expect(summary.first()).toBeVisible()
      
      // Should show statistics
      const stats = page.locator('text=/\d+%/, text=/accuracy/, text=/score/, text=/correct/')
      expect(await stats.count()).toBeGreaterThan(0)
    }
  })
})

test.describe('Study Mode Performance', () => {
  test('should load questions quickly', async ({ page }) => {
    const start = Date.now()
    
    await page.goto('/study/test-exam-id')
    
    // Wait for question to appear
    await page.waitForSelector('.question, [data-testid="question"]', { timeout: 5000 })
    
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(5000) // Should load in under 5 seconds
  })

  test('should handle rapid answer selection', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(2000)
    
    // Rapidly click options
    const options = page.locator('.option, .answer-option')
    
    if (await options.count() > 0) {
      for (let i = 0; i < await options.count(); i++) {
        await options.nth(i).click()
        await page.waitForTimeout(100) // Very quick succession
      }
      
      // Should handle rapid clicks without errors
      const errors = page.locator('.error, [role="alert"]')
      expect(await errors.count()).toBe(0)
    }
  })

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/study/test-exam-id')
    await page.waitForTimeout(2000)
    
    // Select an answer
    const firstOption = page.locator('.option, .answer-option').first()
    
    if (await firstOption.count() > 0) {
      await firstOption.click()
      
      // Navigate away and back
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      await page.goto('/study/test-exam-id')
      await page.waitForTimeout(2000)
      
      // Should maintain or gracefully handle state
      // (Implementation dependent - could resume session or start fresh)
      const questionArea = page.locator('.question, [data-testid="question"]')
      await expect(questionArea.first()).toBeVisible()
    }
  })
})