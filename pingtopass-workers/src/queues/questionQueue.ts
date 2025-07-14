import { ResearcherAgent } from '../agents/researcher'
import { GeneratorAgent } from '../agents/generator'
import { ValidatorAgent } from '../agents/validator'
import { nanoid } from 'nanoid'

export interface ObjectiveJob {
  type: 'objective'
  jobId: string
  examId: string
  objectiveId: string
  userId: string
  perObjectiveCount: number
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  modelId?: string
}

export interface GenerateJob {
  type: 'generate'
  jobId: string
  objectiveId: string
  research: any // ResearchResult
  difficulty: 'easy' | 'medium' | 'hard'
  modelId?: string
}

export type QueueJob = ObjectiveJob | GenerateJob

export async function handleObjectiveJob(job: ObjectiveJob, env: Env) {
  console.log(`Processing objective job: ${job.objectiveId}`)
  
  const progressId = env.PROGRESS.idFromName(job.jobId)
  const progress = env.PROGRESS.get(progressId)

  try {
    // Update progress to processing
    await progress.fetch('/update', {
      method: 'POST',
      body: JSON.stringify({ status: 'processing' })
    })

    // Create researcher agent
    const researcher = new ResearcherAgent(env.OPENROUTER_API_KEY)
    
    // Research the objective (will use cache if available)
    const research = await researcher.research(job.objectiveId, env)
    
    // Fan out generation jobs
    const jobsToQueue: GenerateJob[] = []
    
    if (job.difficulty === 'mixed') {
      // Distribute evenly across difficulties
      const perDifficulty = Math.ceil(job.perObjectiveCount / 3)
      
      for (let i = 0; i < perDifficulty; i++) {
        jobsToQueue.push({
          type: 'generate',
          jobId: job.jobId,
          objectiveId: job.objectiveId,
          research,
          difficulty: 'easy',
          modelId: job.modelId
        })
      }
      
      for (let i = 0; i < perDifficulty; i++) {
        jobsToQueue.push({
          type: 'generate',
          jobId: job.jobId,
          objectiveId: job.objectiveId,
          research,
          difficulty: 'medium',
          modelId: job.modelId
        })
      }
      
      const remaining = job.perObjectiveCount - (perDifficulty * 2)
      for (let i = 0; i < remaining; i++) {
        jobsToQueue.push({
          type: 'generate',
          jobId: job.jobId,
          objectiveId: job.objectiveId,
          research,
          difficulty: 'hard',
          modelId: job.modelId
        })
      }
    } else {
      // All same difficulty
      for (let i = 0; i < job.perObjectiveCount; i++) {
        jobsToQueue.push({
          type: 'generate',
          jobId: job.jobId,
          objectiveId: job.objectiveId,
          research,
          difficulty: job.difficulty,
          modelId: job.modelId
        })
      }
    }

    // Queue all generation jobs
    await env.QUESTION_QUEUE.sendBatch(
      jobsToQueue.map(j => ({ body: j }))
    )

    // Update progress
    await progress.fetch('/update', {
      method: 'POST',
      body: JSON.stringify({
        processedObjectives: 1
      })
    })

    console.log(`Queued ${jobsToQueue.length} generation jobs for objective ${job.objectiveId}`)
  } catch (error) {
    console.error(`Failed to process objective job:`, error)
    
    await progress.fetch('/add-error', {
      method: 'POST',
      body: JSON.stringify({
        error: `Objective ${job.objectiveId}: ${error}`
      })
    })
    
    throw error
  }
}

export async function handleGenerateJob(job: GenerateJob, env: Env) {
  console.log(`Generating question for objective: ${job.objectiveId}`)
  
  const progressId = env.PROGRESS.idFromName(job.jobId)
  const progress = env.PROGRESS.get(progressId)

  try {
    // Create agents
    const modelId = job.modelId || env.DEFAULT_MODEL || 'anthropic/claude-3.5-haiku'
    const generator = new GeneratorAgent(env.OPENROUTER_API_KEY, modelId)
    const validator = new ValidatorAgent(env.OPENROUTER_API_KEY)

    // Generate question
    const startTime = Date.now()
    const question = await generator.generateSingle(job.research, job.difficulty)
    const generationTime = Date.now() - startTime

    // Update generation count
    await progress.fetch('/update', {
      method: 'POST',
      body: JSON.stringify({
        questionsGenerated: 1,
        'metrics.generationTime': generationTime
      })
    })

    // Validate question
    const validationStart = Date.now()
    const validation = await validator.validate(question, job.research)
    const validationTime = Date.now() - validationStart

    // Update validation metrics
    await progress.fetch('/update', {
      method: 'POST',
      body: JSON.stringify({
        'metrics.validationTime': validationTime
      })
    })

    if (validation.isValid || (validation.fixedQuestion && validation.validationScore > 70)) {
      // Save valid question
      const finalQuestion = validation.fixedQuestion || question
      
      await progress.fetch('/add-valid', {
        method: 'POST',
        body: JSON.stringify({ question: finalQuestion })
      })
      
      console.log(`Valid question generated for objective ${job.objectiveId}`)
    } else {
      // Save invalid question for review
      await progress.fetch('/add-invalid', {
        method: 'POST',
        body: JSON.stringify({ question, validation })
      })
      
      console.log(`Invalid question generated for objective ${job.objectiveId}, score: ${validation.validationScore}`)
    }
  } catch (error) {
    console.error(`Failed to generate question:`, error)
    
    await progress.fetch('/add-error', {
      method: 'POST',
      body: JSON.stringify({
        error: `Generation failed: ${error}`
      })
    })
    
    throw error
  }
}