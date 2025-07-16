import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { vendors, exams, objectives, questions } from '../server/database/schema'
import { generateVendorId, generateExamId, generateObjectiveId, generateQuestionId } from '../server/utils/id'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function seed() {
  console.log('🌱 Seeding database...')

  const client = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!,
  })

  const db = drizzle(client)

  try {
    // Create vendors
    const vendorData = [
      { id: generateVendorId(), name: 'CompTIA', isActive: true },
      { id: generateVendorId(), name: 'Microsoft', isActive: true },
      { id: generateVendorId(), name: 'Cisco', isActive: true },
      { id: generateVendorId(), name: 'Amazon Web Services', isActive: true },
    ]

    console.log('Creating vendors...')
    for (const vendor of vendorData) {
      await db.insert(vendors).values(vendor).onConflictDoNothing()
    }

    // Create exams
    const examData = [
      {
        id: generateExamId(),
        vendorId: vendorData[0].id, // CompTIA
        code: 'CompTIA A+ Core 1',
        name: 'CompTIA A+ Certification Exam: Core 1',
        description: 'Covers mobile devices, networking technology, hardware, virtualization and cloud computing, and network troubleshooting.',
        passingScore: 675,
        duration: 90,
        questionCount: 90,
        price: 299,
        isActive: true,
      },
      {
        id: generateExamId(),
        vendorId: vendorData[0].id, // CompTIA
        code: 'CompTIA Network+',
        name: 'CompTIA Network+ Certification Exam',
        description: 'Validates the essential knowledge and skills needed to confidently design, configure, manage and troubleshoot any wired and wireless networks.',
        passingScore: 720,
        duration: 90,
        questionCount: 90,
        price: 299,
        isActive: true,
      },
      {
        id: generateExamId(),
        vendorId: vendorData[1].id, // Microsoft
        code: 'AZ-900',
        name: 'Microsoft Azure Fundamentals',
        description: 'Demonstrates foundational knowledge of cloud services and how those services are provided with Microsoft Azure.',
        passingScore: 700,
        duration: 85,
        questionCount: 60,
        price: 99,
        isActive: true,
      },
      {
        id: generateExamId(),
        vendorId: vendorData[2].id, // Cisco
        code: 'CCNA 200-301',
        name: 'Cisco Certified Network Associate',
        description: 'Tests a candidate\'s knowledge and skills related to network fundamentals, network access, IP connectivity, IP services, security fundamentals, and automation.',
        passingScore: 825,
        duration: 120,
        questionCount: 100,
        price: 300,
        isActive: true,
      },
    ]

    console.log('Creating exams...')
    for (const exam of examData) {
      await db.insert(exams).values(exam).onConflictDoNothing()
    }

    // Create sample objectives for CompTIA A+ Core 1
    const objectiveData = [
      {
        id: generateObjectiveId(),
        examId: examData[0].id,
        title: 'Mobile Devices',
        description: 'Install and configure laptop hardware and components',
        weight: 14,
      },
      {
        id: generateObjectiveId(),
        examId: examData[0].id,
        title: 'Networking',
        description: 'Compare and contrast TCP and UDP ports, protocols, and their purposes',
        weight: 20,
      },
      {
        id: generateObjectiveId(),
        examId: examData[0].id,
        title: 'Hardware',
        description: 'Identify basic cable types, features, and their purposes',
        weight: 27,
      },
    ]

    console.log('Creating objectives...')
    for (const objective of objectiveData) {
      await db.insert(objectives).values(objective).onConflictDoNothing()
    }

    // Create sample questions
    const questionData = [
      {
        id: generateQuestionId(),
        examId: examData[0].id,
        objectiveId: objectiveData[0].id,
        questionText: 'Which of the following laptop components would MOST likely be replaced if a laptop is unable to connect to a wireless network?',
        questionType: 'multiple_choice',
        options: JSON.stringify([
          'LCD screen',
          'Wireless card',
          'RAM',
          'Hard drive'
        ]),
        correctAnswer: JSON.stringify(['Wireless card']),
        explanation: 'The wireless card (also known as Wi-Fi adapter or WLAN card) is responsible for connecting to wireless networks. If a laptop cannot connect to wireless networks, the wireless card is the most likely component that needs to be replaced.',
        isActive: true,
      },
      {
        id: generateQuestionId(),
        examId: examData[0].id,
        objectiveId: objectiveData[1].id,
        questionText: 'Which port number is used by HTTPS?',
        questionType: 'multiple_choice',
        options: JSON.stringify([
          '80',
          '443',
          '21',
          '22'
        ]),
        correctAnswer: JSON.stringify(['443']),
        explanation: 'HTTPS (Hypertext Transfer Protocol Secure) uses port 443. Port 80 is used by HTTP, port 21 by FTP, and port 22 by SSH.',
        isActive: true,
      },
    ]

    console.log('Creating questions...')
    for (const question of questionData) {
      await db.insert(questions).values(question).onConflictDoNothing()
    }

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seed()