import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': 'https://pingtopass.com',
    'X-Title': 'PingToPass Question Seeder'
  }
})

// Initialize database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

interface Exam {
  id: string
  code: string
  name: string
  vendor_name: string
}

interface Objective {
  id: string
  title: string
  description: string
  weight: number
}

async function generateQuestionsForExam(exam: Exam, objectives: Objective[], questionsPerObjective: number = 10) {
  console.log(`\n📝 Generating questions for ${exam.code} - ${exam.name}...`)
  
  const allQuestions = []
  
  for (const objective of objectives) {
    console.log(`  - Generating ${questionsPerObjective} questions for: ${objective.title}`)
    
    const prompt = `Generate ${questionsPerObjective} multiple choice questions for the ${exam.vendor_name} ${exam.code} - ${exam.name} certification exam.

Focus on this specific objective:
Title: ${objective.title}
Description: ${objective.description}
Weight: ${objective.weight}%

Return as JSON array with this exact structure:
[
  {
    "question": "the question text",
    "options": ["A) first option", "B) second option", "C) third option", "D) fourth option"],
    "correctAnswer": "A" | "B" | "C" | "D",
    "explanation": "detailed explanation of why this is the correct answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Requirements:
- Questions should test practical knowledge and real-world scenarios
- Mix conceptual understanding with hands-on application
- Include some scenario-based questions
- Vary difficulty levels appropriately
- Explanations should be educational and reference specific concepts
- Options should be plausible but have one clearly correct answer`

    try {
      const completion = await openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          {
            role: 'system',
            content: `You are an expert IT certification exam question writer specializing in ${exam.vendor_name} technologies. IMPORTANT: Return ONLY valid JSON with no additional text, markdown formatting, or explanations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        console.warn(`    ⚠️  No response for objective ${objective.title}`)
        continue
      }

      // Try to extract JSON if wrapped in markdown
      let jsonContent = response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }
      
      // Also try to find array pattern if not in markdown
      const arrayMatch = jsonContent.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (arrayMatch && !jsonMatch) {
        jsonContent = arrayMatch[0]
      }

      const questions = JSON.parse(jsonContent)
      
      // Add exam and objective info to each question
      questions.forEach((q: any) => {
        q.examId = exam.id
        q.objectiveId = objective.id
      })
      
      allQuestions.push(...questions)
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`    ❌ Error generating questions for ${objective.title}:`, error)
    }
  }
  
  return allQuestions
}

async function seedQuestions() {
  console.log('🌱 Starting question generation process...\n')
  
  try {
    // Get all exams with vendor info
    const examsResult = await db.execute(`
      SELECT e.id, e.code, e.name, v.name as vendor_name
      FROM exams e
      JOIN vendors v ON e.vendor_id = v.id
      WHERE e.is_active = 1
      ORDER BY v.name, e.code
    `)
    
    console.log(`Found ${examsResult.rows.length} active exams to generate questions for.`)
    
    let totalQuestionsGenerated = 0
    
    // Process each exam
    for (const examRow of examsResult.rows) {
      const exam = examRow as unknown as Exam
      
      // Get objectives for this exam
      const objectivesResult = await db.execute({
        sql: 'SELECT id, title, description, weight FROM objectives WHERE exam_id = ? ORDER BY weight DESC',
        args: [exam.id]
      })
      
      const objectives = objectivesResult.rows as unknown as Objective[]
      
      if (objectives.length === 0) {
        console.log(`  ⚠️  No objectives found for ${exam.code}, skipping...`)
        continue
      }
      
      // Generate questions
      const questions = await generateQuestionsForExam(exam, objectives, 2) // 2 questions per objective for faster seeding
      
      // Insert questions into database
      console.log(`  💾 Inserting ${questions.length} questions into database...`)
      
      for (const q of questions) {
        const questionId = generateId('q')
        
        // Get exam ID from objective
        const examResult = await db.execute({
          sql: 'SELECT exam_id FROM objectives WHERE id = ?',
          args: [q.objectiveId]
        })
        const examId = examResult.rows[0]?.exam_id || q.examId
        
        // Prepare options array without letter prefixes
        const cleanOptions = q.options.map((opt: string) => opt.replace(/^[A-D]\)\s*/, ''))
        
        // Prepare correct answer array (for multiple choice, it's a single answer)
        const correctAnswers = [q.correctAnswer]
        
        await db.execute({
          sql: `INSERT INTO questions (
                  id, exam_id, objective_id, question_text,
                  question_type, options, correct_answer,
                  explanation, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
          args: [
            questionId,
            examId,
            q.objectiveId,
            q.question,
            'multiple_choice',
            JSON.stringify(cleanOptions),
            JSON.stringify(correctAnswers),
            q.explanation
          ]
        })
      }
      
      totalQuestionsGenerated += questions.length
      console.log(`  ✅ Generated ${questions.length} questions for ${exam.code}`)
      
      // Delay between exams to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    console.log(`\n✅ Successfully generated ${totalQuestionsGenerated} questions!`)
    
    // Show final count
    const questionCount = await db.execute('SELECT COUNT(*) as count FROM questions')
    console.log(`\n📊 Total questions in database: ${questionCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Error in question generation:', error)
  }
}

// Add command line argument support
const args = process.argv.slice(2)
const examCode = args[0] // Optional: generate for specific exam

if (examCode) {
  console.log(`Generating questions only for exam: ${examCode}`)
  // You can modify the query to filter by exam code
}

// Run the seeder
seedQuestions()