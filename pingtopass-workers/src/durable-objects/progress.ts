import { GeneratedQuestion } from '../agents/generator'
import { ValidationResult } from '../agents/validator'

export interface ProgressState {
  jobId: string
  examId: string
  userId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  totalObjectives: number
  processedObjectives: number
  totalQuestionsRequested: number
  questionsGenerated: number
  questionsValidated: number
  questionsSaved: number
  validQuestions: GeneratedQuestion[]
  invalidQuestions: Array<{
    question: GeneratedQuestion
    validation: ValidationResult
  }>
  errors: string[]
  startedAt: string
  completedAt?: string
  metrics: {
    generationTime: number
    validationTime: number
    totalTime: number
    costEstimate: number
  }
}

export class ProgressTracker implements DurableObject {
  private state: DurableObjectState
  private progress: ProgressState | null = null

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Initialize progress
    if (path === '/init' && request.method === 'POST') {
      const body = await request.json() as {
        jobId: string
        examId: string
        userId: string
        totalObjectives: number
        totalQuestionsRequested: number
      }

      this.progress = {
        ...body,
        status: 'queued',
        processedObjectives: 0,
        questionsGenerated: 0,
        questionsValidated: 0,
        questionsSaved: 0,
        validQuestions: [],
        invalidQuestions: [],
        errors: [],
        startedAt: new Date().toISOString(),
        metrics: {
          generationTime: 0,
          validationTime: 0,
          totalTime: 0,
          costEstimate: 0
        }
      }

      await this.state.storage.put('progress', this.progress)
      return new Response(JSON.stringify({ success: true }))
    }

    // Update progress
    if (path === '/update' && request.method === 'POST') {
      if (!this.progress) {
        this.progress = await this.state.storage.get('progress') || null
      }

      if (!this.progress) {
        return new Response(JSON.stringify({ error: 'Progress not initialized' }), { status: 400 })
      }

      const update = await request.json() as Partial<ProgressState>
      this.progress = { ...this.progress, ...update }

      // Update status based on progress
      if (this.progress.status === 'processing') {
        if (this.progress.processedObjectives >= this.progress.totalObjectives) {
          this.progress.status = 'completed'
          this.progress.completedAt = new Date().toISOString()
          
          // Calculate total time
          const startTime = new Date(this.progress.startedAt).getTime()
          const endTime = new Date(this.progress.completedAt).getTime()
          this.progress.metrics.totalTime = endTime - startTime
        }
      }

      await this.state.storage.put('progress', this.progress)
      return new Response(JSON.stringify({ success: true }))
    }

    // Add valid question
    if (path === '/add-valid' && request.method === 'POST') {
      if (!this.progress) {
        this.progress = await this.state.storage.get('progress') || null
      }

      if (!this.progress) {
        return new Response(JSON.stringify({ error: 'Progress not initialized' }), { status: 400 })
      }

      const { question } = await request.json() as { question: GeneratedQuestion }
      this.progress.validQuestions.push(question)
      this.progress.questionsValidated++
      this.progress.questionsSaved++

      await this.state.storage.put('progress', this.progress)
      return new Response(JSON.stringify({ success: true }))
    }

    // Add invalid question
    if (path === '/add-invalid' && request.method === 'POST') {
      if (!this.progress) {
        this.progress = await this.state.storage.get('progress') || null
      }

      if (!this.progress) {
        return new Response(JSON.stringify({ error: 'Progress not initialized' }), { status: 400 })
      }

      const { question, validation } = await request.json() as {
        question: GeneratedQuestion
        validation: ValidationResult
      }
      
      this.progress.invalidQuestions.push({ question, validation })
      this.progress.questionsValidated++

      await this.state.storage.put('progress', this.progress)
      return new Response(JSON.stringify({ success: true }))
    }

    // Add error
    if (path === '/add-error' && request.method === 'POST') {
      if (!this.progress) {
        this.progress = await this.state.storage.get('progress') || null
      }

      if (!this.progress) {
        return new Response(JSON.stringify({ error: 'Progress not initialized' }), { status: 400 })
      }

      const { error } = await request.json() as { error: string }
      this.progress.errors.push(error)

      // Mark as failed if too many errors
      if (this.progress.errors.length > 10) {
        this.progress.status = 'failed'
        this.progress.completedAt = new Date().toISOString()
      }

      await this.state.storage.put('progress', this.progress)
      return new Response(JSON.stringify({ success: true }))
    }

    // Get current status
    if (path === '/status' && request.method === 'GET') {
      if (!this.progress) {
        this.progress = await this.state.storage.get('progress') || null
      }

      if (!this.progress) {
        return new Response(JSON.stringify({ error: 'Progress not found' }), { status: 404 })
      }

      // Calculate completion percentage
      const completionPercentage = this.progress.totalQuestionsRequested > 0
        ? Math.round((this.progress.questionsSaved / this.progress.totalQuestionsRequested) * 100)
        : 0

      return new Response(JSON.stringify({
        ...this.progress,
        completionPercentage
      }))
    }

    // Get questions for saving
    if (path === '/get-valid-questions' && request.method === 'GET') {
      if (!this.progress) {
        this.progress = await this.state.storage.get('progress') || null
      }

      if (!this.progress) {
        return new Response(JSON.stringify({ error: 'Progress not found' }), { status: 404 })
      }

      return new Response(JSON.stringify({
        questions: this.progress.validQuestions,
        count: this.progress.validQuestions.length
      }))
    }

    return new Response('Not found', { status: 404 })
  }
}