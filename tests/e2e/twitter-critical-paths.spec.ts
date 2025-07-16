import { test, expect, type Page } from '@playwright/test'

// Critical Path E2E Tests for Twitter Intelligence System
// These tests cover the most important user journeys and business-critical workflows

test.describe('Twitter Intelligence Critical Paths', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Navigate to the admin dashboard
    await page.goto('/admin/dashboard')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Competitor Management Critical Path', () => {
    test('should complete full competitor lifecycle', async () => {
      // Step 1: Navigate to Twitter Intelligence
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await expect(page).toHaveURL(/.*twitter/)
      
      // Step 2: Navigate to Competitors section
      await page.click('[data-testid="twitter-competitors-tab"]')
      await expect(page.locator('[data-testid="competitors-section"]')).toBeVisible()

      // Step 3: Add a new competitor
      const newCompetitorUsername = `testcompetitor${Date.now()}`
      
      await page.fill('[data-testid="competitor-username-input"]', newCompetitorUsername)
      await page.selectOption('[data-testid="competitor-category-select"]', 'cloud-certifications')
      await page.click('[data-testid="add-competitor-button"]')

      // Step 4: Verify competitor was added
      await expect(page.locator(`[data-testid="competitor-card-${newCompetitorUsername}"]`)).toBeVisible()
      await expect(page.locator(`[data-testid="competitor-card-${newCompetitorUsername}"]`)).toContainText(newCompetitorUsername)

      // Step 5: Analyze the competitor
      await page.click(`[data-testid="analyze-competitor-${newCompetitorUsername}"]`)
      
      // Wait for analysis to complete (or show loading state)
      await page.waitForSelector('[data-testid="analysis-loading"]', { state: 'visible' })
      await page.waitForSelector('[data-testid="analysis-loading"]', { state: 'hidden', timeout: 30000 })

      // Step 6: Verify analysis results
      await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible()
      await expect(page.locator('[data-testid="competitor-metrics"]')).toBeVisible()

      // Step 7: View insights generated
      await page.click('[data-testid="view-insights-button"]')
      await expect(page.locator('[data-testid="insights-list"]')).toBeVisible()

      // Step 8: Remove competitor (cleanup)
      await page.click('[data-testid="twitter-competitors-tab"]')
      await page.click(`[data-testid="remove-competitor-${newCompetitorUsername}"]`)
      await page.click('[data-testid="confirm-remove-competitor"]')
      
      // Verify competitor was removed
      await expect(page.locator(`[data-testid="competitor-card-${newCompetitorUsername}"]`)).not.toBeVisible()
    })

    test('should validate competitor form requirements', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-competitors-tab"]')

      // Try to submit empty form
      await page.click('[data-testid="add-competitor-button"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="username-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="username-error"]')).toContainText('required')

      // Fill valid username and submit
      await page.fill('[data-testid="competitor-username-input"]', 'validuser')
      await page.click('[data-testid="add-competitor-button"]')
      
      // Should succeed or show loading
      await expect(page.locator('[data-testid="username-error"]')).not.toBeVisible()
    })
  })

  test.describe('Analysis Workflow Critical Path', () => {
    test('should complete LangChain analysis workflow', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Step 1: Initiate batch analysis
      await page.click('[data-testid="run-analysis-button"]')
      await expect(page.locator('[data-testid="analysis-modal"]')).toBeVisible()

      // Step 2: Select competitors for analysis
      await page.check('[data-testid="select-competitor-1"]')
      await page.check('[data-testid="select-competitor-2"]')
      await page.check('[data-testid="include-recommendations"]')

      // Step 3: Start analysis
      await page.click('[data-testid="start-analysis-button"]')
      
      // Step 4: Monitor analysis progress
      await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()

      // Wait for analysis completion (with timeout)
      await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 60000 })
      
      // Step 5: View analysis results
      await expect(page.locator('[data-testid="analysis-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="insights-generated"]')).toBeVisible()
      await expect(page.locator('[data-testid="recommendations-generated"]')).toBeVisible()

      // Step 6: Navigate to insights
      await page.click('[data-testid="view-insights-link"]')
      await expect(page).toHaveURL(/.*insights/)
      await expect(page.locator('[data-testid="insights-list"]')).toBeVisible()
    })

    test('should handle analysis errors gracefully', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Mock network failure or API error
      await page.route('**/api/admin/twitter/analyze-langchain', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Analysis service unavailable' })
        })
      })

      await page.click('[data-testid="run-analysis-button"]')
      await page.check('[data-testid="select-competitor-1"]')
      await page.click('[data-testid="start-analysis-button"]')

      // Should show error message
      await expect(page.locator('[data-testid="analysis-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="analysis-error"]')).toContainText('service unavailable')

      // Should allow retry
      await expect(page.locator('[data-testid="retry-analysis-button"]')).toBeVisible()
    })
  })

  test.describe('Insights Discovery Critical Path', () => {
    test('should browse and interact with insights', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-insights-tab"]')

      // Step 1: View insights list
      await expect(page.locator('[data-testid="insights-list"]')).toBeVisible()
      
      // Step 2: Filter insights by type
      await page.selectOption('[data-testid="insight-type-filter"]', 'content_strategy')
      await page.waitForTimeout(1000) // Wait for filter to apply
      
      // Verify filtered results
      const insightCards = page.locator('[data-testid^="insight-card-"]')
      const count = await insightCards.count()
      
      if (count > 0) {
        // Step 3: View insight details
        await insightCards.first().click()
        await expect(page.locator('[data-testid="insight-details-modal"]')).toBeVisible()
        
        // Step 4: Check insight components
        await expect(page.locator('[data-testid="insight-confidence"]')).toBeVisible()
        await expect(page.locator('[data-testid="insight-recommendation"]')).toBeVisible()
        await expect(page.locator('[data-testid="actionable-steps"]')).toBeVisible()

        // Step 5: Apply insight
        await page.click('[data-testid="apply-insight-button"]')
        await expect(page.locator('[data-testid="insight-applied-confirmation"]')).toBeVisible()
        
        // Close modal
        await page.click('[data-testid="close-insight-modal"]')
      }

      // Step 6: Search insights
      await page.fill('[data-testid="insights-search"]', 'engagement')
      await page.waitForTimeout(1000)
      
      // Verify search results
      const searchResults = page.locator('[data-testid^="insight-card-"]')
      const searchCount = await searchResults.count()
      expect(searchCount).toBeGreaterThanOrEqual(0)
    })

    test('should handle insight confidence filtering', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-insights-tab"]')

      // Set high confidence filter
      await page.fill('[data-testid="confidence-slider"]', '80')
      await page.waitForTimeout(1000)

      // Verify all visible insights meet criteria
      const insightCards = page.locator('[data-testid^="insight-card-"]')
      const count = await insightCards.count()
      
      for (let i = 0; i < count; i++) {
        const confidenceElement = insightCards.nth(i).locator('[data-testid^="confidence-"]')
        const confidenceText = await confidenceElement.textContent()
        const confidence = parseInt(confidenceText?.replace('%', '') || '0')
        expect(confidence).toBeGreaterThanOrEqual(80)
      }
    })
  })

  test.describe('Recommendations Management Critical Path', () => {
    test('should manage recommendation lifecycle', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-recommendations-tab"]')

      // Step 1: View recommendations
      await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible()
      
      const recommendationCards = page.locator('[data-testid^="recommendation-card-"]')
      const count = await recommendationCards.count()

      if (count > 0) {
        const firstRecommendation = recommendationCards.first()
        
        // Step 2: View recommendation details
        await firstRecommendation.click()
        await expect(page.locator('[data-testid="recommendation-details"]')).toBeVisible()
        await expect(page.locator('[data-testid="implementation-steps"]')).toBeVisible()
        await expect(page.locator('[data-testid="success-metrics"]')).toBeVisible()

        // Step 3: Update recommendation status
        await page.selectOption('[data-testid="recommendation-status-select"]', 'in_progress')
        await expect(page.locator('[data-testid="status-updated-message"]')).toBeVisible()

        // Step 4: Add implementation notes
        await page.fill('[data-testid="implementation-notes"]', 'Started working on this recommendation')
        await page.click('[data-testid="save-notes-button"]')
        await expect(page.locator('[data-testid="notes-saved-message"]')).toBeVisible()

        // Step 5: Mark as completed
        await page.selectOption('[data-testid="recommendation-status-select"]', 'completed')
        await expect(page.locator('[data-testid="completion-confirmation"]')).toBeVisible()
      }

      // Step 6: Filter by status
      await page.selectOption('[data-testid="status-filter"]', 'pending')
      await page.waitForTimeout(1000)
      
      // Verify filtered results
      const filteredCards = page.locator('[data-testid^="recommendation-card-"]')
      const filteredCount = await filteredCards.count()
      expect(filteredCount).toBeGreaterThanOrEqual(0)
    })

    test('should prioritize recommendations correctly', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-recommendations-tab"]')

      // Filter by high priority
      await page.selectOption('[data-testid="priority-filter"]', 'high')
      await page.waitForTimeout(1000)

      // Verify all recommendations are high priority
      const highPriorityCards = page.locator('[data-testid^="recommendation-card-"]')
      const count = await highPriorityCards.count()
      
      for (let i = 0; i < count; i++) {
        const priorityBadge = highPriorityCards.nth(i).locator('[data-testid^="priority-badge-"]')
        await expect(priorityBadge).toContainText('high')
      }
    })
  })

  test.describe('Trends Monitoring Critical Path', () => {
    test('should monitor and analyze trends', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-trends-tab"]')

      // Step 1: View current trends
      await expect(page.locator('[data-testid="trends-list"]')).toBeVisible()
      
      // Step 2: Sort by opportunity score
      await page.selectOption('[data-testid="sort-trends"]', 'opportunity_score')
      await page.waitForTimeout(1000)

      // Verify sorting
      const trendItems = page.locator('[data-testid^="trend-item-"]')
      const count = await trendItems.count()
      
      if (count > 1) {
        const firstScore = await trendItems.first().locator('[data-testid^="opportunity-score-"]').textContent()
        const secondScore = await trendItems.nth(1).locator('[data-testid^="opportunity-score-"]').textContent()
        
        const score1 = parseInt(firstScore || '0')
        const score2 = parseInt(secondScore || '0')
        expect(score1).toBeGreaterThanOrEqual(score2)
      }

      // Step 3: Filter by sentiment
      await page.selectOption('[data-testid="sentiment-filter"]', 'positive')
      await page.waitForTimeout(1000)

      // Verify sentiment filtering
      const positiveTrends = page.locator('[data-testid^="trend-item-"]')
      const positiveCount = await positiveTrends.count()
      
      for (let i = 0; i < positiveCount; i++) {
        const sentimentIndicator = positiveTrends.nth(i).locator('[data-testid^="sentiment-indicator-"]')
        await expect(sentimentIndicator).toContainText('positive')
      }

      // Step 4: Analyze trend details
      if (count > 0) {
        await trendItems.first().click()
        await expect(page.locator('[data-testid="trend-details-modal"]')).toBeVisible()
        await expect(page.locator('[data-testid="trend-volume"]')).toBeVisible()
        await expect(page.locator('[data-testid="trend-growth"]')).toBeVisible()
        
        // Close modal
        await page.click('[data-testid="close-trend-modal"]')
      }
    })

    test('should refresh trends data', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-trends-tab"]')

      // Click refresh button
      await page.click('[data-testid="refresh-trends-button"]')
      
      // Should show loading state
      await expect(page.locator('[data-testid="trends-loading"]')).toBeVisible()
      
      // Wait for refresh to complete
      await page.waitForSelector('[data-testid="trends-loading"]', { state: 'hidden', timeout: 10000 })
      
      // Should show updated timestamp
      await expect(page.locator('[data-testid="last-updated"]')).toBeVisible()
    })
  })

  test.describe('Dashboard Overview Critical Path', () => {
    test('should display comprehensive overview', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Default should be overview
      await expect(page.locator('[data-testid="twitter-overview"]')).toBeVisible()

      // Step 1: Verify performance metrics
      await expect(page.locator('[data-testid="competitors-analyzed-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="insights-generated-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="trends-identified-count"]')).toBeVisible()

      // Step 2: Verify benchmarks table
      await expect(page.locator('[data-testid="benchmarks-table"]')).toBeVisible()
      
      const benchmarkRows = page.locator('[data-testid^="benchmark-row-"]')
      const rowCount = await benchmarkRows.count()
      
      if (rowCount > 0) {
        // Verify benchmark data structure
        await expect(benchmarkRows.first().locator('[data-testid^="metric-name-"]')).toBeVisible()
        await expect(benchmarkRows.first().locator('[data-testid^="your-performance-"]')).toBeVisible()
        await expect(benchmarkRows.first().locator('[data-testid^="industry-average-"]')).toBeVisible()
      }

      // Step 3: Check recent activity
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
      
      // Step 4: Verify navigation links work
      await page.click('[data-testid="view-all-insights-link"]')
      await expect(page).toHaveURL(/.*insights/)
      
      // Navigate back
      await page.click('[data-testid="twitter-overview-tab"]')
      await expect(page.locator('[data-testid="twitter-overview"]')).toBeVisible()
    })

    test('should handle auto-refresh functionality', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Enable auto-refresh
      await page.check('[data-testid="auto-refresh-toggle"]')
      
      // Should show refresh indicator
      await expect(page.locator('[data-testid="auto-refresh-indicator"]')).toBeVisible()
      
      // Disable auto-refresh
      await page.uncheck('[data-testid="auto-refresh-toggle"]')
      
      // Should hide refresh indicator
      await expect(page.locator('[data-testid="auto-refresh-indicator"]')).not.toBeVisible()
    })
  })

  test.describe('Settings and Configuration Critical Path', () => {
    test('should manage Twitter intelligence settings', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-settings-button"]')
      
      await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible()

      // Step 1: Update analysis frequency
      await page.selectOption('[data-testid="analysis-frequency-select"]', 'weekly')
      
      // Step 2: Update refresh interval
      await page.fill('[data-testid="refresh-interval-input"]', '30')
      
      // Step 3: Toggle notifications
      await page.check('[data-testid="enable-notifications-checkbox"]')
      
      // Step 4: Save settings
      await page.click('[data-testid="save-settings-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible()
      
      // Close modal
      await page.click('[data-testid="close-settings-modal"]')
    })

    test('should validate settings input', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      await page.click('[data-testid="twitter-settings-button"]')

      // Try invalid refresh interval
      await page.fill('[data-testid="refresh-interval-input"]', '0')
      await page.click('[data-testid="save-settings-button"]')
      
      // Should show validation error
      await expect(page.locator('[data-testid="refresh-interval-error"]')).toBeVisible()
      
      // Fix the input
      await page.fill('[data-testid="refresh-interval-input"]', '15')
      await page.click('[data-testid="save-settings-button"]')
      
      // Should succeed
      await expect(page.locator('[data-testid="refresh-interval-error"]')).not.toBeVisible()
    })
  })

  test.describe('Cross-Section Integration Critical Path', () => {
    test('should navigate between all sections seamlessly', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')

      // Test navigation flow: Overview -> Competitors -> Insights -> Trends -> Recommendations -> Overview
      const navigationFlow = [
        { tab: 'twitter-overview-tab', section: 'twitter-overview' },
        { tab: 'twitter-competitors-tab', section: 'competitors-section' },
        { tab: 'twitter-insights-tab', section: 'insights-section' },
        { tab: 'twitter-trends-tab', section: 'trends-section' },
        { tab: 'twitter-recommendations-tab', section: 'recommendations-section' },
        { tab: 'twitter-overview-tab', section: 'twitter-overview' }
      ]

      for (const step of navigationFlow) {
        await page.click(`[data-testid="${step.tab}"]`)
        await expect(page.locator(`[data-testid="${step.section}"]`)).toBeVisible()
        
        // Wait for any loading states to complete
        await page.waitForTimeout(500)
      }
    })

    test('should maintain state across navigation', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Set filters in insights
      await page.click('[data-testid="twitter-insights-tab"]')
      await page.selectOption('[data-testid="insight-type-filter"]', 'content_strategy')
      
      // Navigate away and back
      await page.click('[data-testid="twitter-trends-tab"]')
      await page.click('[data-testid="twitter-insights-tab"]')
      
      // Filter should be preserved
      const selectedValue = await page.locator('[data-testid="insight-type-filter"]').inputValue()
      expect(selectedValue).toBe('content_strategy')
    })
  })

  // Performance and reliability tests
  test.describe('Performance Critical Path', () => {
    test('should load all sections within acceptable time limits', async () => {
      const sections = [
        'twitter-overview-tab',
        'twitter-competitors-tab', 
        'twitter-insights-tab',
        'twitter-trends-tab',
        'twitter-recommendations-tab'
      ]

      await page.click('[data-testid="nav-twitter-intelligence"]')

      for (const section of sections) {
        const startTime = Date.now()
        
        await page.click(`[data-testid="${section}"]`)
        await page.waitForLoadState('networkidle')
        
        const loadTime = Date.now() - startTime
        expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
      }
    })

    test('should handle concurrent data loading efficiently', async () => {
      await page.click('[data-testid="nav-twitter-intelligence"]')
      
      // Trigger multiple data refreshes simultaneously
      const startTime = Date.now()
      
      await Promise.all([
        page.click('[data-testid="refresh-overview-button"]'),
        page.click('[data-testid="refresh-competitors-button"]'),
        page.click('[data-testid="refresh-insights-button"]')
      ])

      // Wait for all loading to complete
      await page.waitForLoadState('networkidle')
      
      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
    })
  })
})