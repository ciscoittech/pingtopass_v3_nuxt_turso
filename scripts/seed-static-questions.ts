import { createClient } from '@libsql/client'
import { createHash } from 'crypto'
import dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

// Question data structure
interface QuestionData {
  questionText: string
  questionType: 'multiple-choice' | 'multiple-answer'
  options: string[]
  correctAnswer: number[]
  explanation: string
  difficulty?: number
  resources?: Array<{ title: string; url: string }>
  objectiveTitle?: string
}

interface ExamData {
  examCode: string
  examName: string
  vendorName: string
  objectives: Array<{
    title: string
    description: string
    weight: number
  }>
  questions: QuestionData[]
}

// Calculate checksum for question data
function calculateChecksum(data: any): string {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(data))
  return hash.digest('hex')
}

// Check if exam has already been seeded with this checksum
async function hasBeenSeeded(examCode: string, checksum: string): Promise<boolean> {
  try {
    const result = await db.execute({
      sql: 'SELECT id FROM seeding_metadata WHERE exam_code = ? AND checksum = ?',
      args: [examCode, checksum]
    })
    return result.rows.length > 0
  } catch (error) {
    // Table might not exist yet
    return false
  }
}

// Record seeding metadata
async function recordSeeding(examCode: string, checksum: string, questionsCount: number) {
  await db.execute({
    sql: 'INSERT INTO seeding_metadata (exam_code, checksum, questions_count) VALUES (?, ?, ?)',
    args: [examCode, checksum, questionsCount]
  })
}

// Get or create vendor
async function getOrCreateVendor(vendorName: string): Promise<string> {
  // Check if vendor exists
  const existingVendor = await db.execute({
    sql: 'SELECT id FROM vendors WHERE name = ?',
    args: [vendorName]
  })

  if (existingVendor.rows.length > 0) {
    return existingVendor.rows[0].id as string
  }

  // Create new vendor with proper ID format
  const vendorId = `vnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  await db.execute({
    sql: `INSERT INTO vendors (id, name, description, is_active) 
          VALUES (?, ?, ?, ?)`,
    args: [vendorId, vendorName, `${vendorName} certification provider`, 1]
  })

  return vendorId
}

// Get or create exam
async function getOrCreateExam(vendorId: string, examData: ExamData): Promise<string> {
  // Check if exam exists
  const existingExam = await db.execute({
    sql: 'SELECT id FROM exams WHERE code = ?',
    args: [examData.examCode]
  })

  if (existingExam.rows.length > 0) {
    return existingExam.rows[0].id as string
  }

  // Create new exam with proper ID format (exm_ prefix)
  const examId = `exm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  await db.execute({
    sql: `INSERT INTO exams (id, vendor_id, code, name, description, passing_score, duration, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      examId, 
      vendorId, 
      examData.examCode, 
      examData.examName,
      `Practice exam for ${examData.examName} certification`,
      70, // Default passing score
      90, // Default duration in minutes
      1
    ]
  })

  return examId
}

// Create objectives for exam
async function createObjectives(examId: string, objectives: ExamData['objectives']): Promise<Map<string, string>> {
  const objectiveMap = new Map<string, string>()

  for (let i = 0; i < objectives.length; i++) {
    const objective = objectives[i]
    const objectiveId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`
    
    await db.execute({
      sql: `INSERT INTO objectives (id, exam_id, number, title, description, weight, "order", is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [objectiveId, examId, `${i + 1}.0`, objective.title, objective.description, objective.weight, i + 1, 1]
    })

    objectiveMap.set(objective.title, objectiveId)
    
    // Small delay to ensure unique timestamps
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  return objectiveMap
}

// Seed questions for an exam
async function seedExamQuestions(examData: ExamData) {
  console.log(`\n📚 Seeding ${examData.examCode} - ${examData.examName}...`)

  // Calculate checksum
  const checksum = calculateChecksum(examData)

  // Check if already seeded
  if (await hasBeenSeeded(examData.examCode, checksum)) {
    console.log(`✅ ${examData.examCode} already seeded with current data. Skipping...`)
    return
  }

  // Start transaction
  try {
    // Get or create vendor
    const vendorId = await getOrCreateVendor(examData.vendorName)
    console.log(`  ✓ Vendor: ${examData.vendorName}`)

    // Get or create exam
    const examId = await getOrCreateExam(vendorId, examData)
    console.log(`  ✓ Exam: ${examData.examCode}`)

    // Create objectives
    const objectiveMap = await createObjectives(examId, examData.objectives)
    console.log(`  ✓ Created ${examData.objectives.length} objectives`)

    // Insert questions
    let questionCount = 0
    for (const question of examData.questions) {
      const questionId = `qst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${questionCount}`
      
      // Get objective ID from title
      const objectiveId = question.objectiveTitle 
        ? objectiveMap.get(question.objectiveTitle) || objectiveMap.values().next().value
        : objectiveMap.values().next().value

      // Map numeric difficulty to text
      const difficultyMap: { [key: number]: string } = {
        1: 'easy',
        2: 'medium',
        3: 'hard'
      }
      const difficulty = difficultyMap[question.difficulty || 2] || 'medium'
      
      await db.execute({
        sql: `INSERT INTO questions (
                id, exam_id, objective_id, question_text, question_type, 
                options, correct_answer, explanation, is_active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          questionId,
          examId,
          objectiveId,
          question.questionText,
          question.questionType,
          JSON.stringify(question.options),
          JSON.stringify(question.correctAnswer),
          question.explanation,
          1
        ]
      })

      questionCount++
      if (questionCount % 10 === 0) {
        console.log(`  ✓ Inserted ${questionCount} questions...`)
      }
    }

    // Record seeding metadata
    await recordSeeding(examData.examCode, checksum, questionCount)

    console.log(`✅ Successfully seeded ${questionCount} questions for ${examData.examCode}`)

  } catch (error) {
    console.error(`❌ Error seeding ${examData.examCode}:`, error)
    throw error
  }
}

// Load exam data from JSON file
async function loadExamData(filename: string): Promise<ExamData> {
  const filePath = path.join(__dirname, 'data', filename)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

// Main seeding function
async function seedAllExams() {
  console.log('🚀 Starting question seeding process...')
  console.log('📋 Only seeding requested exams: CompTIA N+, S+, L+, Cisco CCNA, AWS Solutions Architect\n')

  const examFiles = [
    'comptia-network-plus.json',
    'comptia-security-plus.json',
    'comptia-linux-plus.json',
    'cisco-ccna.json',
    'aws-solutions-architect.json'
  ]

  try {
    // Ensure seeding_metadata table exists
    console.log('📊 Checking database schema...')
    
    try {
      // Create seeding_metadata table if it doesn't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS seeding_metadata (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          exam_code TEXT NOT NULL,
          checksum TEXT NOT NULL,
          questions_count INTEGER,
          seeded_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(exam_code, checksum)
        )
      `)
      
      // Try to add missing columns to questions table
      const alterStatements = [
        'ALTER TABLE questions ADD COLUMN exam_id TEXT',
        'ALTER TABLE questions ADD COLUMN options TEXT DEFAULT \'[]\'',
        'ALTER TABLE questions ADD COLUMN correct_answer TEXT DEFAULT \'[]\'',
        'ALTER TABLE questions ADD COLUMN resources TEXT DEFAULT \'[]\''
      ]
      
      for (const stmt of alterStatements) {
        try {
          await db.execute(stmt)
        } catch (error: any) {
          // Ignore if column already exists
          if (!error.message.includes('duplicate column')) {
            // Silent fail - column likely already exists
          }
        }
      }
      
      console.log('✅ Database schema ready\n')
    } catch (error: any) {
      console.log('  ⚠️  Schema check warning:', error.message)
    }

    // Seed each exam
    for (const filename of examFiles) {
      try {
        const examData = await loadExamData(filename)
        await seedExamQuestions(examData)
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log(`  ⚠️  Skipping ${filename} - file not found`)
        } else {
          throw error
        }
      }
    }

    console.log('\n✅ Question seeding completed successfully!')
    console.log('📊 Run the app and navigate to study/test mode to see the questions.')

  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await db.close()
  }
}

// Run seeding
seedAllExams().catch(console.error)