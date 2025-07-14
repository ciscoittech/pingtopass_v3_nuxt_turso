import { OpenRouterClient } from '../utils/openrouter'
import { getDB, objectives, exams } from '../utils/db'
import { eq } from 'drizzle-orm'

export interface ResearchResult {
  objectiveId: string
  objectiveTitle: string
  objectiveDescription: string
  examContext: string
  keyTopics: string[]
  practicalApplications: string[]
  commonMisconceptions: string[]
  difficultyGuidelines: {
    easy: string
    medium: string
    hard: string
  }
}

export class ResearcherAgent {
  private openRouter: OpenRouterClient
  
  constructor(apiKey: string) {
    this.openRouter = new OpenRouterClient(apiKey)
  }

  async research(objectiveId: string, env: Env): Promise<ResearchResult> {
    // Check cache first
    const cacheKey = `research:${objectiveId}`
    const cached = await env.RESEARCH_CACHE.get(cacheKey, 'json')
    if (cached) {
      console.log(`Using cached research for objective ${objectiveId}`)
      return cached as ResearchResult
    }

    // Get objective and exam details from database
    const db = getDB(env)
    const objective = await db
      .select({
        id: objectives.id,
        title: objectives.title,
        description: objectives.description,
        examId: objectives.examId
      })
      .from(objectives)
      .where(eq(objectives.id, objectiveId))
      .then(rows => rows[0])

    if (!objective) {
      throw new Error(`Objective ${objectiveId} not found`)
    }

    // Get exam details
    const exam = await db
      .select({
        name: exams.name,
        code: exams.code,
        description: exams.description
      })
      .from(exams)
      .where(eq(exams.id, objective.examId))
      .then(rows => rows[0])

    if (!exam) {
      throw new Error(`Exam ${objective.examId} not found`)
    }

    // Generate comprehensive research using AI
    const researchPrompt = `
You are researching the certification exam objective for question generation.

Exam: ${exam.name} (${exam.code})
Objective: ${objective.title}
Description: ${objective.description || 'N/A'}

Provide comprehensive research about this objective including:
1. Key topics and concepts that should be tested
2. Practical real-world applications
3. Common misconceptions or tricky areas
4. Guidelines for different difficulty levels

Format your response as JSON:
{
  "keyTopics": ["topic1", "topic2", ...],
  "practicalApplications": ["application1", "application2", ...],
  "commonMisconceptions": ["misconception1", "misconception2", ...],
  "difficultyGuidelines": {
    "easy": "What makes a question easy for this topic",
    "medium": "What makes a question medium difficulty",
    "hard": "What makes a question challenging"
  }
}`

    const response = await this.openRouter.chat({
      model: 'anthropic/claude-3.5-haiku',
      messages: [
        { role: 'system', content: 'You are an expert in IT certification exam content.' },
        { role: 'user', content: researchPrompt }
      ],
      temperature: 0.5,
      max_tokens: 2000
    })

    const researchData = JSON.parse(response.choices[0]?.message?.content || '{}')

    const result: ResearchResult = {
      objectiveId: objective.id,
      objectiveTitle: objective.title,
      objectiveDescription: objective.description || '',
      examContext: `${exam.name} (${exam.code})`,
      ...researchData
    }

    // Cache the research for 24 hours
    await env.RESEARCH_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 86400 // 24 hours
    })

    return result
  }

  async researchMultiple(objectiveIds: string[], env: Env): Promise<ResearchResult[]> {
    const results = await Promise.all(
      objectiveIds.map(id => this.research(id, env))
    )
    return results
  }
}