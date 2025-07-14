import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

// Initialize database client
const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function seedBasicData() {
  console.log('🌱 Seeding basic vendor and exam data...\n')

  try {
    // First, let's check if we already have data
    const existingVendors = await db.execute('SELECT COUNT(*) as count FROM vendors')
    const vendorCount = existingVendors.rows[0].count as number
    
    if (vendorCount > 0) {
      console.log(`✅ Already have ${vendorCount} vendors in database`)
      const existingExams = await db.execute('SELECT COUNT(*) as count FROM exams')
      const examCount = existingExams.rows[0].count as number
      console.log(`✅ Already have ${examCount} exams in database`)
      
      // List them
      const vendors = await db.execute('SELECT * FROM vendors LIMIT 5')
      console.log('\n📋 Sample vendors:')
      vendors.rows.forEach(v => console.log(`  - ${v.name}`))
      
      const exams = await db.execute('SELECT * FROM exams LIMIT 5')
      console.log('\n📋 Sample exams:')
      exams.rows.forEach(e => console.log(`  - ${e.code}: ${e.name}`))
      
      return
    }

    // Basic vendor data
    const vendors = [
      {
        id: generateId('vendor'),
        name: 'Amazon Web Services',
        description: 'Leading cloud computing platform provider',
        website: 'https://aws.amazon.com/certification/',
        isActive: true
      },
      {
        id: generateId('vendor'),
        name: 'Microsoft',
        description: 'Global technology company offering Azure cloud certifications',
        website: 'https://learn.microsoft.com/certifications/',
        isActive: true
      },
      {
        id: generateId('vendor'),
        name: 'Google Cloud',
        description: 'Google Cloud Platform certification provider',
        website: 'https://cloud.google.com/certification',
        isActive: true
      }
    ]

    // Insert vendors
    console.log('📦 Inserting vendors...')
    for (const vendor of vendors) {
      await db.execute({
        sql: 'INSERT INTO vendors (id, name, description, website, isActive) VALUES (?, ?, ?, ?, ?)',
        args: [vendor.id, vendor.name, vendor.description, vendor.website, vendor.isActive ? 1 : 0]
      })
      console.log(`  ✅ Added vendor: ${vendor.name}`)
    }

    // Basic exam data
    const exams = [
      // AWS Exams
      {
        id: generateId('exam'),
        vendorId: vendors[0].id,
        code: 'AWS-SAA-C03',
        name: 'AWS Certified Solutions Architect - Associate',
        description: 'Validates ability to design distributed systems on AWS',
        passingScore: 72,
        duration: 130,
        questionCount: 65,
        price: 150,
        isActive: true,
        isRetired: false
      },
      {
        id: generateId('exam'),
        vendorId: vendors[0].id,
        code: 'AWS-CLF-C02',
        name: 'AWS Certified Cloud Practitioner',
        description: 'Foundational understanding of AWS Cloud',
        passingScore: 70,
        duration: 90,
        questionCount: 65,
        price: 100,
        isActive: true,
        isRetired: false
      },
      // Microsoft Exams
      {
        id: generateId('exam'),
        vendorId: vendors[1].id,
        code: 'AZ-104',
        name: 'Microsoft Azure Administrator',
        description: 'Implementing, managing, and monitoring Azure environments',
        passingScore: 70,
        duration: 120,
        questionCount: 60,
        price: 165,
        isActive: true,
        isRetired: false
      },
      {
        id: generateId('exam'),
        vendorId: vendors[1].id,
        code: 'AZ-900',
        name: 'Microsoft Azure Fundamentals',
        description: 'Foundational knowledge of cloud services and Azure',
        passingScore: 70,
        duration: 85,
        questionCount: 60,
        price: 99,
        isActive: true,
        isRetired: false
      },
      // Google Cloud Exams
      {
        id: generateId('exam'),
        vendorId: vendors[2].id,
        code: 'GCP-ACE',
        name: 'Google Cloud Associate Cloud Engineer',
        description: 'Deploy applications, monitor operations, and manage GCP solutions',
        passingScore: 70,
        duration: 120,
        questionCount: 50,
        price: 125,
        isActive: true,
        isRetired: false
      }
    ]

    // Insert exams
    console.log('\n📚 Inserting exams...')
    for (const exam of exams) {
      await db.execute({
        sql: `INSERT INTO exams (id, vendorId, code, name, description, passingScore, duration, 
              questionCount, price, isActive, isRetired) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [exam.id, exam.vendorId, exam.code, exam.name, exam.description, 
               exam.passingScore, exam.duration, exam.questionCount, exam.price, 
               exam.isActive ? 1 : 0, exam.isRetired ? 1 : 0]
      })
      console.log(`  ✅ Added exam: ${exam.code} - ${exam.name}`)
    }

    // Add some basic objectives for AWS SAA
    const objectives = [
      {
        id: generateId('obj'),
        examId: exams[0].id,
        title: 'Design Secure Architectures',
        description: 'Design secure access to AWS resources, application tiers, and data protection',
        displayOrder: 1
      },
      {
        id: generateId('obj'),
        examId: exams[0].id,
        title: 'Design Resilient Architectures',
        description: 'Design scalable and loosely coupled architectures, multi-tier architectures',
        displayOrder: 2
      },
      {
        id: generateId('obj'),
        examId: exams[0].id,
        title: 'Design High-Performing Architectures',
        description: 'Identify elastic and scalable compute solutions, high-performing storage and databases',
        displayOrder: 3
      },
      {
        id: generateId('obj'),
        examId: exams[0].id,
        title: 'Design Cost-Optimized Architectures',
        description: 'Identify cost-effective storage, compute, and database solutions',
        displayOrder: 4
      }
    ]

    console.log('\n📝 Inserting objectives for AWS SAA...')
    for (const objective of objectives) {
      await db.execute({
        sql: `INSERT INTO objectives (id, examId, title, description, displayOrder) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [objective.id, objective.examId, objective.title, objective.description, objective.displayOrder]
      })
      console.log(`  ✅ Added objective: ${objective.title}`)
    }

    console.log('\n✨ Basic data seeding complete!')
    console.log('\n📊 Summary:')
    console.log(`  - ${vendors.length} vendors added`)
    console.log(`  - ${exams.length} exams added`)
    console.log(`  - ${objectives.length} objectives added`)
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    await db.close()
  }
}

// Run the seeder
seedBasicData()