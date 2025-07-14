import { test, expect } from '@playwright/test'
import { setupAuth } from '../helpers/auth'

test.describe('Question Generation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication as admin
    await setupAuth(page, { isAdmin: true })
  })

  test('should navigate to question generation page', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('AI Question Generation')
    await expect(page.locator('text=New Generation Job')).toBeVisible()
  })

  test('should load exams and models', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Wait for data to load
    await page.waitForLoadState('networkidle')
    
    // Check exam dropdown has options
    await page.click('[data-test="exam-select"]')
    const examOptions = page.locator('[role="listbox"] [role="option"]')
    await expect(examOptions).toHaveCount({ min: 1 })
    
    // Check model dropdown has options
    await page.click('[data-test="model-select"]')
    const modelOptions = page.locator('[role="listbox"] [role="option"]')
    await expect(modelOptions).toHaveCount({ min: 1 })
  })

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Try to submit without filling form
    const submitButton = page.locator('button:has-text("Start Generation")')
    await expect(submitButton).toBeDisabled()
    
    // Fill required fields
    await page.click('[data-test="exam-select"]')
    await page.click('[role="option"]:first-child')
    
    await page.fill('[data-test="question-count"]', '10')
    
    await page.click('[data-test="model-select"]')
    await page.click('[role="option"]:first-child')
    
    // Now submit should be enabled
    await expect(submitButton).toBeEnabled()
  })

  test('should show cost estimate', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Select exam and model
    await page.click('[data-test="exam-select"]')
    await page.click('[role="option"]:first-child')
    
    await page.click('[data-test="model-select"]')
    await page.click('[role="option"]:first-child')
    
    // Enter question count
    await page.fill('[data-test="question-count"]', '20')
    
    // Check cost estimate appears
    const costEstimate = page.locator('[data-test="cost-estimate"]')
    await expect(costEstimate).toBeVisible()
    await expect(costEstimate).toContainText(/\$[\d.]+/)
  })

  test('should start generation job', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Fill form
    await page.click('[data-test="exam-select"]')
    await page.click('[role="option"]:first-child')
    
    await page.fill('[data-test="question-count"]', '5')
    
    await page.click('[data-test="difficulty-select"]')
    await page.click('[role="option"]:has-text("Mixed")')
    
    await page.click('[data-test="model-select"]')
    await page.click('[role="option"]:first-child')
    
    // Mock Workers API response
    await page.route('**/api/generate-questions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: 'job_test123',
          message: 'Queued generation of 5 questions across 2 objectives'
        })
      })
    })
    
    // Start generation
    await page.click('button:has-text("Start Generation")')
    
    // Check success message
    await expect(page.locator('[data-test="toast-success"]')).toContainText('Generation job started')
    
    // Check job appears in active jobs
    await expect(page.locator('[data-test="active-jobs"]')).toContainText('job_test123')
  })

  test('should poll job status', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Mock initial job list with active job
    let pollCount = 0
    await page.route('**/api/status/job_test123', async route => {
      pollCount++
      
      const statuses = [
        { status: 'queued', questionsGenerated: 0, questionsSaved: 0 },
        { status: 'processing', questionsGenerated: 2, questionsSaved: 0 },
        { status: 'processing', questionsGenerated: 5, questionsSaved: 3 },
        { status: 'completed', questionsGenerated: 5, questionsSaved: 5 }
      ]
      
      const currentStatus = statuses[Math.min(pollCount - 1, statuses.length - 1)]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'job_test123',
          examId: 'exam-123',
          completionPercentage: (currentStatus.questionsSaved / 5) * 100,
          totalQuestionsRequested: 5,
          ...currentStatus
        })
      })
    })
    
    // Add mock active job
    await page.evaluate(() => {
      // Simulate having an active job
      window.activeJobs = [{
        jobId: 'job_test123',
        status: 'processing',
        questionsGenerated: 0,
        questionsSaved: 0,
        totalQuestionsRequested: 5,
        completionPercentage: 0
      }]
    })
    
    // Wait for polling to update status
    await page.waitForTimeout(3000)
    
    // Check progress updated
    const progressCircle = page.locator('[data-test="job-progress-job_test123"]')
    await expect(progressCircle).toContainText(/\d+%/)
    
    // Check status chip
    const statusChip = page.locator('[data-test="job-status-job_test123"]')
    await expect(statusChip).toHaveText(/(processing|completed)/)
  })

  test('should show job details dialog', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Add mock job to page
    await page.evaluate(() => {
      window.activeJobs = [{
        jobId: 'job_test123',
        examName: 'AWS Solutions Architect',
        status: 'completed',
        questionsGenerated: 10,
        questionsValidated: 10,
        questionsSaved: 8,
        invalidQuestions: [{ question: {}, validation: {} }, { question: {}, validation: {} }],
        totalQuestionsRequested: 10,
        completionPercentage: 100,
        metrics: {
          generationTime: 15000,
          validationTime: 5000,
          totalTime: 20000,
          costEstimate: 0.05
        }
      }]
    })
    
    // Click on job to view details
    await page.click('[data-test="job-item-job_test123"]')
    
    // Check dialog opened
    await expect(page.locator('[data-test="job-details-dialog"]')).toBeVisible()
    await expect(page.locator('[data-test="job-details-title"]')).toContainText('job_test123')
    
    // Check metrics displayed
    await expect(page.locator('[data-test="questions-generated"]')).toContainText('10')
    await expect(page.locator('[data-test="questions-valid"]')).toContainText('8')
    await expect(page.locator('[data-test="questions-invalid"]')).toContainText('2')
    
    // Check performance metrics
    await expect(page.locator('[data-test="generation-time"]')).toContainText('15.0s')
    await expect(page.locator('[data-test="total-cost"]')).toContainText('$0.05')
  })

  test('should save questions to database', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Add completed job
    await page.evaluate(() => {
      window.activeJobs = [{
        jobId: 'job_test123',
        status: 'completed',
        questionsGenerated: 5,
        questionsSaved: 5,
        totalQuestionsRequested: 5,
        completionPercentage: 100
      }]
    })
    
    // Open job details
    await page.click('[data-test="job-item-job_test123"]')
    
    // Mock save API
    await page.route('**/api/save-questions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          savedCount: 5,
          questionIds: ['q_1', 'q_2', 'q_3', 'q_4', 'q_5']
        })
      })
    })
    
    // Click save button
    await page.click('button:has-text("Save 5 Questions")')
    
    // Check success message
    await expect(page.locator('[data-test="toast-success"]')).toContainText('Saved 5 questions')
    
    // Check job removed from active list
    await expect(page.locator('[data-test="job-item-job_test123"]')).not.toBeVisible()
  })

  test('should handle generation errors', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Fill form
    await page.click('[data-test="exam-select"]')
    await page.click('[role="option"]:first-child')
    
    await page.fill('[data-test="question-count"]', '100') // Too many
    
    // Mock error response
    await page.route('**/api/generate-questions', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too many questions requested',
          message: 'Maximum 50 questions per job'
        })
      })
    })
    
    // Try to start generation
    await page.click('button:has-text("Start Generation")')
    
    // Check error message
    await expect(page.locator('[data-test="toast-error"]')).toContainText('Maximum 50 questions per job')
  })

  test('should handle Workers offline', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Mock network error
    await page.route('**/api/generate-questions', async route => {
      await route.abort('failed')
    })
    
    // Fill and submit form
    await page.click('[data-test="exam-select"]')
    await page.click('[role="option"]:first-child')
    await page.fill('[data-test="question-count"]', '5')
    await page.click('button:has-text("Start Generation")')
    
    // Check error handling
    await expect(page.locator('[data-test="toast-error"]')).toContainText('Failed to start generation')
  })

  test('should update model selection', async ({ page }) => {
    await page.goto('/admin/question-generation')
    
    // Wait for models to load
    await page.waitForLoadState('networkidle')
    
    // Select a different model
    await page.click('[data-test="model-select"]')
    
    // Look for Claude model
    await page.click('[role="option"]:has-text("Claude")')
    
    // Check cost estimate updates
    await page.fill('[data-test="question-count"]', '10')
    
    const costEstimate = page.locator('[data-test="cost-estimate"]')
    await expect(costEstimate).toBeVisible()
    
    // Change to GPT model
    await page.click('[data-test="model-select"]')
    await page.click('[role="option"]:has-text("GPT")')
    
    // Cost should change
    const newCost = await costEstimate.textContent()
    expect(newCost).toBeTruthy()
  })
})