 Detailed Lessons Learned: Study Results Page Debug Session

  Overview of the Issue

  The study results page was failing to display session results despite the data being correctly stored in sessionStorage. This seemingly simple issue took extensive debugging due to multiple compounding problems that masked the root cause.

  Root Causes Identified

  1. Nuxt 3 Nested Routing Misunderstanding

  The Problem: The results page was structured as pages/study/[examId]/results.vue, creating a nested route. In Nuxt 3, this requires the parent [examId].vue to include a <NuxtPage /> component to render child routes.

  Why It Happened:
  - Assumption that Nuxt 3 routing works like Nuxt 2 or traditional file-based routing
  - The nested folder structure seemed logical for organization

  The Fix: Renamed to pages/study/[examId]-results.vue for a flat route structure

  Lesson: Always verify routing patterns when using nested folders in Nuxt 3. The framework has specific requirements for nested routes.

  2. Client-Side Hydration Issues

  The Problem: The results page was trying to access sessionStorage during SSR, causing hydration mismatches.

  Why It Happened:
  - Initial ref was calling getSessionResults() during SSR
  - process.client checks weren't properly implemented
  - Race conditions between navigation and data loading

  The Fix:
  - Initialize storedResults as null and load data only in onMounted
  - Added proper loading states
  - Ensured navigation happens before state reset

  Lesson: Always separate server-side and client-side logic explicitly. Never assume client-only APIs are available during initialization.

  3. TypeScript Type Errors

  The Problem: TypeScript inferred storedResults as type never when null, causing compilation errors.

  Why It Happened:
  - Strict TypeScript configuration
  - No explicit typing for the ref

  The Fix: Added explicit any type: const storedResults = ref<any>(null)

  Lesson: Be explicit with types for data that changes shape between null and populated states.

  4. Performance Issues (19-33 second delays)

  The Problem: Navigation to results page was taking 19-33 seconds.

  Why It Happened:
  - Synchronous API calls during page load
  - Auth middleware making blocking requests
  - No lazy loading of non-critical data

  The Fix:
  - Removed blocking API call for exam data
  - Used data already available in sessionStorage
  - Made operations asynchronous where possible

  Lesson: Profile performance early. Long delays often indicate blocking operations that should be async.

  Why Testing Didn't Catch This

  1. Unit Tests Limitations

  Unit tests typically:
  - Test individual functions/components in isolation
  - Mock browser APIs like sessionStorage
  - Don't test routing or navigation
  - Don't test the full application context

  What was missed:
  - The routing configuration issue (requires full app context)
  - Client-side hydration problems (requires SSR/CSR cycle)
  - Performance issues (requires real navigation)

  2. E2E Tests Limitations

  Even E2E tests missed this because:
  - They might not have covered the specific flow: start session → answer questions → navigate to results
  - They might have used direct navigation to results page (bypassing the issue)
  - Timing issues might not manifest in test environments
  - The nested routing issue only appears in production builds

  3. Integration Testing Gap

  The real gap was in integration testing:
  - No tests for the complete user journey from session start to results
  - No tests for sessionStorage persistence across navigation
  - No tests for routing configuration validation

  Proper Testing Strategy Going Forward

  1. Unit Tests

  // Test individual components
  describe('ResultsPage', () => {
    it('should load results from sessionStorage on mount', () => {
      const mockResults = { sessionId: 'test', statistics: {...} }
      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(mockResults))

      const wrapper = mount(ResultsPage)

      expect(wrapper.vm.storedResults).toEqual(mockResults)
    })
  })

  2. Integration Tests

  // Test component interactions
  describe('Study Flow Integration', () => {
    it('should navigate to results after session completion', async () => {
      // Start session
      await studyStore.startSession(config)

      // Complete session
      await studyStore.endSession('complete')

      // Verify navigation
      expect(router.currentRoute.value.path).toBe('/study/exam-123-results')

      // Verify data persistence
      expect(sessionStorage.getItem('studyResults')).toBeTruthy()
    })
  })

  3. E2E Tests

  // Test complete user journeys
  test('complete study session flow', async ({ page }) => {
    // Login
    await login(page)

    // Start study session
    await page.goto('/study/exam-123')
    await page.click('button:has-text("Start Session")')

    // Answer questions
    await page.click('.answer-option')
    await page.click('button:has-text("Submit")')
    await page.click('button:has-text("Continue")')

    // Verify results page
    await page.waitForURL('**/study/*-results')
    await expect(page.locator('h1')).toContainText(['Great Job', 'Keep Practicing'])
    await expect(page.locator('.score')).toBeVisible()
  })

  4. Route Testing

  // Specifically test routing configuration
  describe('Route Configuration', () => {
    it('should have study results route', () => {
      const routes = router.getRoutes()
      const resultsRoute = routes.find(r => r.path.includes('study') && r.path.includes('results'))
      expect(resultsRoute).toBeDefined()
      expect(resultsRoute.path).toBe('/study/:examId-results')
    })
  })

  Key Lessons for Moving Faster

  1. Start with the Simplest Solution

  - We spent time on complex debugging when the issue was a simple routing problem
  - Always check basics first: Is the route accessible? Is the component loading?

  2. Use Better Debugging Tools Earlier

  - Browser DevTools Network tab would have shown no request to results page
  - Vue DevTools would have shown which component was rendering
  - Simple console.log at component top level tells you if it's loading

  3. Understand Framework Patterns

  - Read Nuxt 3 migration guides thoroughly
  - Understand differences from Nuxt 2 (nested routing behavior changed)
  - Check generated files (.nuxt/routes.json) to verify routing

  4. Test the Right Things

  - Test complete user flows, not just individual functions
  - Test with real browser APIs, not just mocks
  - Test navigation and routing explicitly

  5. Performance Monitoring

  - Add performance tracking from day one
  - Set up alerts for slow operations (>1 second)
  - Use performance marks in critical paths

  Specific Recommendations for Test Mode

  1. Verify Routing First
    - Check that /test/[examId]-results pattern is used (not nested)
    - Ensure parent-child route relationships are correct
  2. Plan for State Management
    - Test mode likely uses different storage (localStorage vs sessionStorage)
    - May have different data structure
    - Plan for state persistence across page reloads
  3. Add Logging Early
  console.log('[Test Results] Component loaded')
  console.log('[Test Results] Route:', route.path)
  console.log('[Test Results] Storage check:', localStorage.getItem('testResults'))
  4. Create Debug Utilities
  // debug-utils.ts
  export function debugTestResults() {
    return {
      route: window.location.pathname,
      storage: localStorage.getItem('testResults'),
      vueApp: !!window.$nuxt,
      component: document.querySelector('.results-card')
    }
  }
  5. Test Incrementally
    - Get basic navigation working first
    - Then add data loading
    - Then add UI features
    - Finally optimize performance

  Conclusion

  This debugging session revealed that our biggest issues weren't in the business logic but in framework understanding and testing gaps. The fix was ultimately simple (renaming a file), but finding it required extensive debugging due to multiple overlapping issues.

  Going forward:
  1. Test complete user journeys, not just units
  2. Understand framework routing deeply before structuring pages
  3. Add comprehensive logging from the start
  4. Monitor performance continuously
  5. Create debugging utilities proactively

  For test mode, apply these lessons immediately:
  - Use flat routing structure
  - Add logging at every critical point
  - Test the complete flow early
  - Monitor performance from the start
  - Create debug tools before you need them
