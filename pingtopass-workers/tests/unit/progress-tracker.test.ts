import { describe, it, expect, beforeEach } from 'vitest'
import { ProgressTracker } from '../../src/durable-objects/progress'

// Mock Durable Object State
class MockDurableObjectState {
  private storage = new Map<string, any>()

  storage = {
    get: async (key: string) => this.storage.get(key),
    put: async (key: string, value: any) => {
      this.storage.set(key, value)
    },
    delete: async (key: string) => {
      this.storage.delete(key)
    },
    list: async () => new Map(this.storage)
  }
}

describe('ProgressTracker Durable Object', () => {
  let state: MockDurableObjectState
  let tracker: ProgressTracker

  beforeEach(() => {
    state = new MockDurableObjectState()
    tracker = new ProgressTracker(state as any)
  })

  describe('POST /init', () => {
    it('should initialize progress state', async () => {
      const initData = {
        jobId: 'job_123',
        examId: 'exam_456',
        userId: 'user_789',
        totalObjectives: 5,
        totalQuestionsRequested: 50
      }

      const request = new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify(initData)
      })

      const response = await tracker.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify state was saved
      const savedProgress = await state.storage.get('progress')
      expect(savedProgress).toBeDefined()
      expect(savedProgress.jobId).toBe('job_123')
      expect(savedProgress.status).toBe('queued')
      expect(savedProgress.totalObjectives).toBe(5)
      expect(savedProgress.questionsGenerated).toBe(0)
    })
  })

  describe('POST /update', () => {
    beforeEach(async () => {
      // Initialize progress first
      const initData = {
        jobId: 'job_123',
        examId: 'exam_456',
        userId: 'user_789',
        totalObjectives: 5,
        totalQuestionsRequested: 50
      }

      await tracker.fetch(new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify(initData)
      }))
    })

    it('should update progress status', async () => {
      const request = new Request('http://localhost/update', {
        method: 'POST',
        body: JSON.stringify({ status: 'processing' })
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const progress = await state.storage.get('progress')
      expect(progress.status).toBe('processing')
    })

    it('should update multiple fields', async () => {
      const request = new Request('http://localhost/update', {
        method: 'POST',
        body: JSON.stringify({
          questionsGenerated: 10,
          processedObjectives: 2,
          'metrics.generationTime': 5000
        })
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const progress = await state.storage.get('progress')
      expect(progress.questionsGenerated).toBe(10)
      expect(progress.processedObjectives).toBe(2)
      expect(progress.metrics.generationTime).toBe(5000)
    })

    it('should auto-complete when all objectives processed', async () => {
      const request = new Request('http://localhost/update', {
        method: 'POST',
        body: JSON.stringify({
          status: 'processing',
          processedObjectives: 5 // Equal to totalObjectives
        })
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const progress = await state.storage.get('progress')
      expect(progress.status).toBe('completed')
      expect(progress.completedAt).toBeDefined()
      expect(progress.metrics.totalTime).toBeGreaterThan(0)
    })
  })

  describe('POST /add-valid', () => {
    beforeEach(async () => {
      await tracker.fetch(new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify({
          jobId: 'job_123',
          examId: 'exam_456',
          userId: 'user_789',
          totalObjectives: 1,
          totalQuestionsRequested: 10
        })
      }))
    })

    it('should add valid question and update counts', async () => {
      const question = {
        id: 'q_123',
        question: 'Test question?',
        options: ['A) A', 'B) B', 'C) C', 'D) D'],
        correctAnswer: 'B',
        explanation: 'Test explanation',
        difficulty: 'medium',
        metadata: {}
      }

      const request = new Request('http://localhost/add-valid', {
        method: 'POST',
        body: JSON.stringify({ question })
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const progress = await state.storage.get('progress')
      expect(progress.validQuestions).toHaveLength(1)
      expect(progress.validQuestions[0].id).toBe('q_123')
      expect(progress.questionsValidated).toBe(1)
      expect(progress.questionsSaved).toBe(1)
    })
  })

  describe('POST /add-invalid', () => {
    beforeEach(async () => {
      await tracker.fetch(new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify({
          jobId: 'job_123',
          examId: 'exam_456',
          userId: 'user_789',
          totalObjectives: 1,
          totalQuestionsRequested: 10
        })
      }))
    })

    it('should add invalid question with validation result', async () => {
      const invalidData = {
        question: {
          id: 'q_bad',
          question: 'Bad question',
          options: [],
          correctAnswer: 'Z',
          explanation: '',
          difficulty: 'invalid',
          metadata: {}
        },
        validation: {
          questionId: 'q_bad',
          isValid: false,
          issues: ['No options', 'Invalid answer'],
          suggestions: ['Add 4 options', 'Use A-D for answer'],
          validationScore: 0
        }
      }

      const request = new Request('http://localhost/add-invalid', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const progress = await state.storage.get('progress')
      expect(progress.invalidQuestions).toHaveLength(1)
      expect(progress.invalidQuestions[0].question.id).toBe('q_bad')
      expect(progress.invalidQuestions[0].validation.issues).toHaveLength(2)
      expect(progress.questionsValidated).toBe(1)
      expect(progress.questionsSaved).toBe(0) // Not saved because invalid
    })
  })

  describe('POST /add-error', () => {
    beforeEach(async () => {
      await tracker.fetch(new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify({
          jobId: 'job_123',
          examId: 'exam_456',
          userId: 'user_789',
          totalObjectives: 1,
          totalQuestionsRequested: 10
        })
      }))
    })

    it('should add error to list', async () => {
      const request = new Request('http://localhost/add-error', {
        method: 'POST',
        body: JSON.stringify({ error: 'API rate limit exceeded' })
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const progress = await state.storage.get('progress')
      expect(progress.errors).toContain('API rate limit exceeded')
    })

    it('should mark job as failed after too many errors', async () => {
      // Add 11 errors (threshold is 10)
      for (let i = 0; i < 11; i++) {
        await tracker.fetch(new Request('http://localhost/add-error', {
          method: 'POST',
          body: JSON.stringify({ error: `Error ${i}` })
        }))
      }

      const progress = await state.storage.get('progress')
      expect(progress.errors).toHaveLength(11)
      expect(progress.status).toBe('failed')
      expect(progress.completedAt).toBeDefined()
    })
  })

  describe('GET /status', () => {
    beforeEach(async () => {
      await tracker.fetch(new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify({
          jobId: 'job_123',
          examId: 'exam_456',
          userId: 'user_789',
          totalObjectives: 2,
          totalQuestionsRequested: 20
        })
      }))

      // Add some progress
      await tracker.fetch(new Request('http://localhost/update', {
        method: 'POST',
        body: JSON.stringify({
          status: 'processing',
          questionsGenerated: 10,
          questionsSaved: 8
        })
      }))
    })

    it('should return current status with completion percentage', async () => {
      const request = new Request('http://localhost/status', {
        method: 'GET'
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const status = await response.json()
      expect(status.jobId).toBe('job_123')
      expect(status.status).toBe('processing')
      expect(status.questionsGenerated).toBe(10)
      expect(status.questionsSaved).toBe(8)
      expect(status.completionPercentage).toBe(40) // 8/20 * 100
    })

    it('should return 404 when no progress found', async () => {
      // Clear state
      await state.storage.delete('progress')

      const request = new Request('http://localhost/status', {
        method: 'GET'
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('Progress not found')
    })
  })

  describe('GET /get-valid-questions', () => {
    beforeEach(async () => {
      await tracker.fetch(new Request('http://localhost/init', {
        method: 'POST',
        body: JSON.stringify({
          jobId: 'job_123',
          examId: 'exam_456',
          userId: 'user_789',
          totalObjectives: 1,
          totalQuestionsRequested: 5
        })
      }))

      // Add some valid questions
      for (let i = 0; i < 3; i++) {
        await tracker.fetch(new Request('http://localhost/add-valid', {
          method: 'POST',
          body: JSON.stringify({
            question: {
              id: `q_${i}`,
              question: `Question ${i}?`,
              options: ['A) A', 'B) B', 'C) C', 'D) D'],
              correctAnswer: 'A',
              explanation: 'Test',
              difficulty: 'medium',
              metadata: {}
            }
          })
        }))
      }
    })

    it('should return all valid questions', async () => {
      const request = new Request('http://localhost/get-valid-questions', {
        method: 'GET'
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.questions).toHaveLength(3)
      expect(data.count).toBe(3)
      expect(data.questions[0].id).toBe('q_0')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost/update', {
        method: 'POST',
        body: 'invalid json'
      })

      await expect(tracker.fetch(request)).rejects.toThrow()
    })

    it('should return 404 for unknown routes', async () => {
      const request = new Request('http://localhost/unknown', {
        method: 'GET'
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('Not found')
    })

    it('should require initialization before updates', async () => {
      const request = new Request('http://localhost/update', {
        method: 'POST',
        body: JSON.stringify({ status: 'processing' })
      })

      const response = await tracker.fetch(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Progress not initialized')
    })
  })
})