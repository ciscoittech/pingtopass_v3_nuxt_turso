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
    'X-Title': 'PingToPass Seeder'
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

async function generateVendorsAndExams() {
  console.log('🌱 Generating IT certification vendors and exams...\n')
  console.log('Using API key:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set')

  try {
    // Generate vendor and exam data using AI
    console.log('📡 Calling OpenRouter API...')
    const prompt = `Generate a comprehensive list of major IT certification vendors and their popular exams. 
    Return as JSON with this exact structure:
    {
      "vendors": [
        {
          "name": "vendor name",
          "description": "brief description",
          "website": "official website URL",
          "exams": [
            {
              "code": "exam code",
              "name": "exam full name",
              "description": "detailed exam description",
              "passingScore": number (65-80),
              "duration": minutes (60-300),
              "questionCount": number (40-100),
              "price": USD amount,
              "difficulty": "easy" | "medium" | "hard",
              "objectives": [
                {
                  "title": "objective title",
                  "description": "detailed objective description",
                  "weight": percentage (5-30)
                }
              ]
            }
          ]
        }
      ]
    }
    
    Include only these 3 vendors for now: Cisco, VMware, and Oracle.
    For each vendor, include 2-3 of their most popular certification exams.
    Each exam should have 3-4 realistic objectives that cover the exam domains.`

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3-0324',
      messages: [
        {
          role: 'system',
          content: 'You are an IT certification expert. Generate realistic and accurate certification data. IMPORTANT: Return ONLY valid JSON with no additional text, markdown formatting, or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
    
    console.log('✅ Received response from OpenRouter')

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }
    
    // Log first 200 chars to debug
    console.log('Response preview:', response.substring(0, 200) + '...')

    // Try to extract JSON if wrapped in markdown
    let jsonContent = response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1]
    }

    // Parse the JSON response
    const data = JSON.parse(jsonContent)
    
    console.log(`Generated ${data.vendors.length} vendors with exams and objectives\n`)

    // Insert vendors and exams into database
    for (const vendor of data.vendors) {
      // Check if vendor already exists
      const existingVendor = await db.execute({
        sql: 'SELECT id FROM vendors WHERE name = ?',
        args: [vendor.name]
      })
      
      let vendorId: string
      if (existingVendor.rows.length > 0) {
        vendorId = existingVendor.rows[0].id as string
        console.log(`Vendor already exists: ${vendor.name}`)
      } else {
        vendorId = generateId('vendor')
        console.log(`Creating vendor: ${vendor.name}`)
        
        // Insert vendor
        await db.execute({
          sql: `INSERT INTO vendors (id, name, description, website, created_at, updated_at) 
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          args: [vendorId, vendor.name, vendor.description, vendor.website]
        })
      }
      
      // Insert exams for this vendor
      for (const exam of vendor.exams) {
        // Check if exam already exists
        const existingExam = await db.execute({
          sql: 'SELECT id FROM exams WHERE code = ?',
          args: [exam.code]
        })
        
        let examId: string
        if (existingExam.rows.length > 0) {
          examId = existingExam.rows[0].id as string
          console.log(`  - Exam already exists: ${exam.code}`)
          continue // Skip objectives for existing exam
        } else {
          examId = generateId('exam')
          console.log(`  - Creating exam: ${exam.code} - ${exam.name}`)
          
          // Insert exam
          await db.execute({
            sql: `INSERT INTO exams (
                    id, vendor_id, code, name, description, 
                    passing_score, duration, question_count, price,
                    is_active, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            args: [
              examId, vendorId, exam.code, exam.name, exam.description,
              exam.passingScore, exam.duration, exam.questionCount, exam.price || 0
            ]
          })
        }
        
        // Insert objectives for this exam
        for (const objective of exam.objectives) {
          const objectiveId = generateId('obj')
          
          console.log(`    - Creating objective: ${objective.title}`)
          
          await db.execute({
            sql: `INSERT INTO objectives (
                    id, exam_id, number, title, description, weight_percentage,
                    created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`,
            args: [
              objectiveId, 
              examId, 
              `${exam.code}-OBJ-${exam.objectives.indexOf(objective) + 1}`,
              objective.title, 
              objective.description, 
              Math.round(objective.weight)
            ]
          })
        }
      }
    }
    
    console.log('\n✅ Successfully seeded vendors, exams, and objectives!')
    
    // Show summary
    const vendorCount = await db.execute('SELECT COUNT(*) as count FROM vendors')
    const examCount = await db.execute('SELECT COUNT(*) as count FROM exams')
    const objectiveCount = await db.execute('SELECT COUNT(*) as count FROM objectives')
    
    console.log('\n📊 Database Summary:')
    console.log(`  - Vendors: ${vendorCount.rows[0].count}`)
    console.log(`  - Exams: ${examCount.rows[0].count}`)
    console.log(`  - Objectives: ${objectiveCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
  }
}

// Run the seeder
generateVendorsAndExams()