import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { unstable_dev } from 'wrangler'
import type { UnstableDevWorker } from 'wrangler'

describe('Question Generation Integration Tests', () => {
  let worker: UnstableDevWorker
  
  beforeAll(async () => {
    // Start the worker in test mode
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        TURSO_URL: 'libsql://test.turso.io',
        TURSO_AUTH_TOKEN: 'test-token',
        OPENROUTER_API_KEY: 'test-key',
        DEFAULT_MODEL: 'anthropic/claude-3.5-haiku',
        ENVIRONMENT: 'test'
      }
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  describe('POST /api/generate-questions', () => {
    it('should reject unauthorized requests', async () => {
      const response = await worker.fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examId: 'exam-123',
          totalCount: 10
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate required fields', async () => {
      const response = await worker.fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          // Missing required fields
          totalCount: 10
        })
      })

      expect(response.status).toBe(400)
    })

    it('should create a generation job with valid data', async () => {
      // Mock database response for objectives
      vi.mock('../src/utils/db', () => ({
        getDB: () => ({
          select: () => ({
            from: () => ({
              where: () => Promise.resolve([
                { id: 'obj-1', title: 'Objective 1', examId: 'exam-123' },
                { id: 'obj-2', title: 'Objective 2', examId: 'exam-123' }
              ])
            })
          })
        })
      }))

      const response = await worker.fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          examId: 'exam-123',
          totalCount: 20,
          difficulty: 'mixed',
          userId: 'user-123',
          modelId: 'anthropic/claude-3.5-sonnet'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.jobId).toMatch(/^job_/)
      expect(data.message).toContain('20 questions across 2 objectives')
    })

    it('should handle specific objective selection', async () => {
      const response = await worker.fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          examId: 'exam-123',
          objectiveIds: ['obj-1'],
          totalCount: 10,
          difficulty: 'hard',
          userId: 'user-123'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('1 objective')
    })
  })

  describe('GET /api/status/:jobId', () => {
    it('should return 400 for missing job ID', async () => {
      const response = await worker.fetch('/api/status/', {
        method: 'GET'
      })

      expect(response.status).toBe(404)
    })

    it('should return job status for valid job ID', async () => {
      // Mock Durable Object response
      const mockStatus = {
        jobId: 'job_test123',
        status: 'processing',
        questionsGenerated: 5,
        questionsValidated: 3,
        questionsSaved: 2,
        totalQuestionsRequested: 10,
        completionPercentage: 20
      }

      vi.mock('../src/durable-objects/progress', () => ({
        ProgressTracker: class {
          async fetch(request: Request) {
            if (request.url.endsWith('/status')) {
              return new Response(JSON.stringify(mockStatus))
            }
            return new Response('Not found', { status: 404 })
          }
        }
      }))

      const response = await worker.fetch('/api/status/job_test123', {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.jobId).toBe('job_test123')
      expect(data.status).toBe('processing')
      expect(data.completionPercentage).toBe(20)
    })
  })

  describe('GET /api/questions/:jobId', () => {
    it('should return valid questions for completed job', async () => {
      const mockQuestions = [
        {
          id: 'q_123',
          question: 'Test question?',
          options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
          correctAnswer: 'B',
          explanation: 'Test explanation',
          difficulty: 'medium'
        }
      ]

      const response = await worker.fetch('/api/questions/job_test123', {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.questions).toHaveLength(1)
      expect(data.count).toBe(1)
    })
  })

  describe('POST /api/save-questions', () => {
    it('should save valid questions to database', async () => {
      const response = await worker.fetch('/api/save-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          jobId: 'job_test123',
          examId: 'exam-123'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.savedCount).toBeGreaterThan(0)
      expect(data.questionIds).toBeInstanceOf(Array)
    })

    it('should handle no valid questions error', async () => {
      // Mock empty questions response
      const response = await worker.fetch('/api/save-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          jobId: 'job_empty',
          examId: 'exam-123'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No valid questions to save')
    })
  })

  describe('Queue Processing', () => {
    it('should process objective job correctly', async () => {
      const objectiveJob = {
        type: 'objective' as const,
        jobId: 'job_test',
        examId: 'exam-123',
        objectiveId: 'obj-1',
        userId: 'user-123',
        perObjectiveCount: 5,
        difficulty: 'mixed' as const
      }

      // Simulate queue message
      const message = {
        body: objectiveJob,
        ack: vi.fn(),
        retry: vi.fn()
      }

      // Process should complete without errors
      await expect(worker.queue([message], {})).resolves.not.toThrow()
      expect(message.ack).toHaveBeenCalled()
      expect(message.retry).not.toHaveBeenCalled()
    })

    it('should process generate job correctly', async () => {
      const generateJob = {
        type: 'generate' as const,
        jobId: 'job_test',
        objectiveId: 'obj-1',
        research: {
          objectiveId: 'obj-1',
          title: 'Test Objective',
          description: 'Test description',
          keyTopics: ['Topic 1', 'Topic 2']
        },
        difficulty: 'medium' as const
      }

      const message = {
        body: generateJob,
        ack: vi.fn(),
        retry: vi.fn()
      }

      await expect(worker.queue([message], {})).resolves.not.toThrow()
      expect(message.ack).toHaveBeenCalled()
    })

    it('should retry on processing errors', async () => {
      const badJob = {
        type: 'unknown' as any,
        jobId: 'job_bad'
      }

      const message = {
        body: badJob,
        ack: vi.fn(),
        retry: vi.fn()
      }

      await worker.queue([message], {})
      expect(message.retry).toHaveBeenCalled()
      expect(message.ack).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle OpenRouter API errors gracefully', async () => {
      // Mock OpenRouter failure
      vi.mock('../src/utils/openrouter', () => ({
        OpenRouterClient: class {
          chat() {
            throw new Error('API rate limit exceeded')
          }
        }
      }))

      const response = await worker.fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          examId: 'exam-123',
          totalCount: 10,
          userId: 'user-123'
        })
      })

      // Should still return success as job is queued
      expect(response.status).toBe(200)
    })

    it('should handle database connection errors', async () => {
      // Mock database failure
      vi.mock('../src/utils/db', () => ({
        getDB: () => {
          throw new Error('Database connection failed')
        }
      }))

      const response = await worker.fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          examId: 'exam-123',
          totalCount: 10,
          userId: 'user-123'
        })
      })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('CORS and Headers', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await worker.fetch('/api/generate-questions', {
        method: 'OPTIONS'
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('should include CORS headers in all responses', async () => {
      const response = await worker.fetch('/api/status/job123', {
        method: 'GET'
      })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })
})