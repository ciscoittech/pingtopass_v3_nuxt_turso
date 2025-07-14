import { handleObjectiveJob, handleGenerateJob, type QueueJob } from './queues/questionQueue'
import { getDB, exams, objectives, questions } from './utils/db'
import { eq, and, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export interface Env {
  // KV Namespaces
  RESEARCH_CACHE: KVNamespace
  QUESTION_CACHE: KVNamespace
  
  // Durable Objects
  PROGRESS: DurableObjectNamespace
  
  // Queues
  QUESTION_QUEUE: Queue<QueueJob>
  
  // Secrets
  TURSO_URL: string
  TURSO_AUTH_TOKEN: string
  OPENROUTER_API_KEY: string
  
  // Variables
  DEFAULT_MODEL?: string
  ENVIRONMENT?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    try {
      // Start question generation job
      if (url.pathname === '/api/generate-questions' && request.method === 'POST') {
        const auth = request.headers.get('Authorization')
        if (!auth || !auth.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers
          })
        }

        const body = await request.json() as {
          examId: string
          objectiveIds?: string[]
          totalCount: number
          difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
          userId: string
          modelId?: string
        }

        const jobId = `job_${nanoid()}`
        const db = getDB(env)

        // Get objectives for the exam
        let objectiveList
        if (body.objectiveIds && body.objectiveIds.length > 0) {
          objectiveList = await db
            .select()
            .from(objectives)
            .where(and(
              eq(objectives.examId, body.examId),
              inArray(objectives.id, body.objectiveIds)
            ))
        } else {
          objectiveList = await db
            .select()
            .from(objectives)
            .where(eq(objectives.examId, body.examId))
        }

        if (objectiveList.length === 0) {
          return new Response(JSON.stringify({ 
            error: 'No objectives found for exam' 
          }), {
            status: 400,
            headers
          })
        }

        // Initialize progress tracking
        const progressId = env.PROGRESS.idFromName(jobId)
        const progress = env.PROGRESS.get(progressId)
        
        await progress.fetch('/init', {
          method: 'POST',
          body: JSON.stringify({
            jobId,
            examId: body.examId,
            userId: body.userId,
            totalObjectives: objectiveList.length,
            totalQuestionsRequested: body.totalCount
          })
        })

        // Calculate questions per objective
        const perObjectiveCount = Math.ceil(body.totalCount / objectiveList.length)

        // Queue jobs for each objective
        const jobs = objectiveList.map(obj => ({
          type: 'objective' as const,
          jobId,
          examId: body.examId,
          objectiveId: obj.id,
          userId: body.userId,
          perObjectiveCount,
          difficulty: body.difficulty || 'mixed',
          modelId: body.modelId
        }))

        await env.QUESTION_QUEUE.sendBatch(
          jobs.map(job => ({ body: job }))
        )

        return new Response(JSON.stringify({
          success: true,
          jobId,
          message: `Queued generation of ${body.totalCount} questions across ${objectiveList.length} objectives`
        }), { headers })
      }

      // Get job status
      if (url.pathname.startsWith('/api/status/') && request.method === 'GET') {
        const jobId = url.pathname.split('/').pop()
        if (!jobId) {
          return new Response(JSON.stringify({ error: 'Job ID required' }), {
            status: 400,
            headers
          })
        }

        const progressId = env.PROGRESS.idFromName(jobId)
        const progress = env.PROGRESS.get(progressId)
        
        const statusResponse = await progress.fetch('/status')
        const status = await statusResponse.json()

        return new Response(JSON.stringify(status), { headers })
      }

      // Get generated questions
      if (url.pathname.startsWith('/api/questions/') && request.method === 'GET') {
        const jobId = url.pathname.split('/').pop()
        if (!jobId) {
          return new Response(JSON.stringify({ error: 'Job ID required' }), {
            status: 400,
            headers
          })
        }

        const progressId = env.PROGRESS.idFromName(jobId)
        const progress = env.PROGRESS.get(progressId)
        
        const questionsResponse = await progress.fetch('/get-valid-questions')
        const data = await questionsResponse.json()

        return new Response(JSON.stringify(data), { headers })
      }

      // Save questions to database
      if (url.pathname === '/api/save-questions' && request.method === 'POST') {
        const body = await request.json() as {
          jobId: string
          examId: string
        }

        const progressId = env.PROGRESS.idFromName(body.jobId)
        const progress = env.PROGRESS.get(progressId)
        
        // Get valid questions
        const questionsResponse = await progress.fetch('/get-valid-questions')
        const { questions: validQuestions } = await questionsResponse.json() as { questions: any[] }

        if (validQuestions.length === 0) {
          return new Response(JSON.stringify({ 
            error: 'No valid questions to save' 
          }), {
            status: 400,
            headers
          })
        }

        // Save to database
        const db = getDB(env)
        const savedQuestions = []

        for (const q of validQuestions) {
          const questionId = `q_${nanoid()}`
          
          await db.insert(questions).values({
            id: questionId,
            examId: body.examId,
            objectiveId: q.objectiveId || null,
            questionText: q.question,
            optionA: q.options[0]?.replace(/^A\)\s*/, '') || '',
            optionB: q.options[1]?.replace(/^B\)\s*/, '') || '',
            optionC: q.options[2]?.replace(/^C\)\s*/, '') || '',
            optionD: q.options[3]?.replace(/^D\)\s*/, '') || '',
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            isActive: true,
            metadata: JSON.stringify(q.metadata),
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000)
          })

          savedQuestions.push(questionId)
        }

        return new Response(JSON.stringify({
          success: true,
          savedCount: savedQuestions.length,
          questionIds: savedQuestions
        }), { headers })
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
      })

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers
      })
    }
  },

  async queue(batch: MessageBatch<QueueJob>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const job = message.body
        
        switch (job.type) {
          case 'objective':
            await handleObjectiveJob(job, env)
            break
          case 'generate':
            await handleGenerateJob(job, env)
            break
          default:
            console.error('Unknown job type:', job)
        }
        
        // Acknowledge message
        message.ack()
      } catch (error) {
        console.error('Queue processing error:', error)
        // Retry the message
        message.retry()
      }
    }
  }
}

// Export Durable Object
export { ProgressTracker } from './durable-objects/progress'