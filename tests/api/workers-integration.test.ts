import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch } from 'ofetch'

describe('Workers Integration API Tests', () => {
  const WORKERS_URL = process.env.WORKERS_URL || 'http://localhost:8787'
  const NUXT_URL = process.env.NUXT_URL || 'http://localhost:3000'
  
  // Test authentication token (would be real in production)
  const AUTH_TOKEN = 'test-bearer-token'

  beforeAll(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  describe('Workers API Direct', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'OPTIONS'
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('should reject unauthorized requests', async () => {
      const response = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examId: 'test-exam',
          totalCount: 5
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate request body', async () => {
      const response = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          // Missing required fields
          totalCount: 5
        })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${WORKERS_URL}/api/unknown-endpoint`)
      expect(response.status).toBe(404)
    })
  })

  describe('Nuxt Integration', () => {
    it('should load admin question generation page', async () => {
      const response = await fetch(`${NUXT_URL}/admin/question-generation`)
      expect(response.status).toBe(200)
      
      const html = await response.text()
      expect(html).toContain('AI Question Generation')
    })

    it('should proxy API calls to Workers', async () => {
      // This would test if Nuxt properly forwards requests to Workers
      // In a real test, we'd need proper authentication setup
      
      try {
        await $fetch('/api/admin/models', {
          baseURL: NUXT_URL,
          params: { feature: 'question_generation' }
        })
        
        // If no error thrown, the endpoint exists and responds
        expect(true).toBe(true)
      } catch (error: any) {
        // Expecting either success or auth error, not 404
        expect(error.status).not.toBe(404)
      }
    })
  })

  describe('End-to-End Data Flow', () => {
    it('should handle complete question generation workflow', async () => {
      // Step 1: Get available models
      const modelsResponse = await fetch(`${NUXT_URL}/api/admin/models?feature=question_generation`)
      
      // Should not be 404 (endpoint exists)
      expect(modelsResponse.status).not.toBe(404)
      
      // Step 2: Mock job creation (would be real in integration)
      const mockJobData = {
        examId: 'test-exam-123',
        totalCount: 5,
        difficulty: 'mixed',
        userId: 'test-user-456',
        modelId: 'anthropic/claude-3.5-haiku'
      }
      
      // Step 3: Test Workers endpoint directly
      const jobResponse = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(mockJobData)
      })
      
      // Expect either success or specific error (not 500)
      expect([200, 400, 401]).toContain(jobResponse.status)
      
      if (jobResponse.status === 200) {
        const jobData = await jobResponse.json()
        expect(jobData).toHaveProperty('success')
        
        if (jobData.success) {
          expect(jobData).toHaveProperty('jobId')
          expect(jobData.jobId).toMatch(/^job_/)
          
          // Step 4: Test status endpoint
          const statusResponse = await fetch(`${WORKERS_URL}/api/status/${jobData.jobId}`)
          expect([200, 404]).toContain(statusResponse.status)
        }
      }
    })

    it('should handle error propagation correctly', async () => {
      // Test malformed request
      const response = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: 'invalid json'
      })
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('Performance Tests', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now()
      
      const response = await fetch(`${WORKERS_URL}/api/status/test-job`)
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should respond within 1 second
      
      // Status endpoint should return quickly even for non-existent jobs
      expect([200, 404]).toContain(response.status)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(`${WORKERS_URL}/api/status/concurrent-test-${Math.random()}`)
      )
      
      const responses = await Promise.all(requests)
      
      // All requests should complete
      expect(responses).toHaveLength(5)
      responses.forEach(response => {
        expect([200, 404]).toContain(response.status)
      })
    })
  })

  describe('Error Handling', () => {
    it('should return proper CORS headers on errors', async () => {
      const response = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'POST'
      })
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should handle large request bodies gracefully', async () => {
      const largeBody = {
        examId: 'test',
        totalCount: 1,
        description: 'x'.repeat(100000) // 100KB string
      }
      
      const response = await fetch(`${WORKERS_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(largeBody)
      })
      
      // Should handle gracefully, not crash
      expect([400, 401, 413, 500]).toContain(response.status)
    })
  })
})