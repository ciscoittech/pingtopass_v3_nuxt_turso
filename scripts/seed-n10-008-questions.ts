import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function seedN10008Questions() {
  try {
    console.log('🌱 Seeding N10-008 questions and objectives...')
    
    // Get N10-008 exam
    const examResult = await db.execute("SELECT * FROM exams WHERE code = 'N10-008'")
    if (examResult.rows.length === 0) {
      console.error('N10-008 exam not found!')
      return
    }
    
    const exam = examResult.rows[0]
    const examId = exam.id as string
    console.log(`Found exam: ${exam.code} - ${exam.name}`)
    
    // First, add objectives for N10-008
    const objectives = [
      {
        id: generateId('obj'),
        exam_id: examId,
        number: '1.0',
        title: 'Networking Concepts',
        description: 'Explain concepts related to the OSI model, network topologies, and network types',
        weight_percentage: 20,
        order: 1,
        is_active: 1
      },
      {
        id: generateId('obj'),
        exam_id: examId,
        number: '2.0',
        title: 'Network Infrastructure',
        description: 'Configure and deploy network infrastructure components',
        weight_percentage: 20,
        order: 2,
        is_active: 1
      },
      {
        id: generateId('obj'),
        exam_id: examId,
        number: '3.0',
        title: 'Network Operations',
        description: 'Monitor and optimize network performance',
        weight_percentage: 20,
        order: 3,
        is_active: 1
      },
      {
        id: generateId('obj'),
        exam_id: examId,
        number: '4.0',
        title: 'Network Security',
        description: 'Configure and manage network security devices and software',
        weight_percentage: 20,
        order: 4,
        is_active: 1
      },
      {
        id: generateId('obj'),
        exam_id: examId,
        number: '5.0',
        title: 'Network Troubleshooting',
        description: 'Troubleshoot common network service issues',
        weight_percentage: 20,
        order: 5,
        is_active: 1
      }
    ]
    
    // Insert objectives
    console.log('\nInserting objectives...')
    for (const obj of objectives) {
      await db.execute({
        sql: `INSERT INTO objectives (id, exam_id, number, title, description, weight_percentage, "order", is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [obj.id, obj.exam_id, obj.number, obj.title, obj.description, obj.weight_percentage, obj.order, obj.is_active]
      })
      console.log(`  ✓ Added objective: ${obj.number} ${obj.title}`)
    }
    
    // Sample questions for N10-008
    const questions = [
      // Networking Concepts questions
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[0].id,
        question_text: 'Which OSI model layer is responsible for establishing, maintaining, and terminating connections between applications?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'Physical Layer',
          'Data Link Layer',
          'Session Layer',
          'Transport Layer'
        ]),
        correct_answer: JSON.stringify(['Session Layer']),
        explanation: 'The Session Layer (Layer 5) of the OSI model is responsible for establishing, maintaining, and terminating connections between applications. It manages dialog control and coordinates communication between systems.',
        difficulty: 'intermediate',
        is_active: 1
      },
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[0].id,
        question_text: 'What is the primary purpose of VLAN tagging?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'To increase network speed',
          'To identify which VLAN a frame belongs to',
          'To encrypt network traffic',
          'To compress data packets'
        ]),
        correct_answer: JSON.stringify(['To identify which VLAN a frame belongs to']),
        explanation: 'VLAN tagging (802.1Q) adds a tag to Ethernet frames to identify which VLAN the frame belongs to. This allows multiple VLANs to share the same physical network infrastructure while maintaining logical separation.',
        difficulty: 'intermediate',
        is_active: 1
      },
      // Network Infrastructure questions
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[1].id,
        question_text: 'Which IPv6 address type is equivalent to IPv4 private addresses?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'Link-local addresses',
          'Unique local addresses',
          'Multicast addresses',
          'Anycast addresses'
        ]),
        correct_answer: JSON.stringify(['Unique local addresses']),
        explanation: 'Unique local addresses (ULA) in IPv6 are similar to IPv4 private addresses. They use the prefix FC00::/7 and are not routable on the global Internet, making them suitable for internal network use.',
        difficulty: 'intermediate',
        is_active: 1
      },
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[1].id,
        question_text: 'What is the default administrative distance for OSPF?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          '90',
          '110',
          '120',
          '170'
        ]),
        correct_answer: JSON.stringify(['110']),
        explanation: 'OSPF (Open Shortest Path First) has a default administrative distance of 110. Administrative distance is used by routers to select the best path when multiple routing protocols provide routes to the same destination.',
        difficulty: 'intermediate',
        is_active: 1
      },
      // Network Operations questions
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[2].id,
        question_text: 'Which SNMP version provides authentication and encryption?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'SNMPv1',
          'SNMPv2c',
          'SNMPv3',
          'All SNMP versions'
        ]),
        correct_answer: JSON.stringify(['SNMPv3']),
        explanation: 'SNMPv3 is the only version of SNMP that provides both authentication and encryption. It adds security features including message integrity, authentication, and encryption, making it suitable for secure network management.',
        difficulty: 'intermediate',
        is_active: 1
      },
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[2].id,
        question_text: 'What is the primary purpose of NetFlow?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'To encrypt network traffic',
          'To collect IP traffic information',
          'To block malicious traffic',
          'To compress network packets'
        ]),
        correct_answer: JSON.stringify(['To collect IP traffic information']),
        explanation: 'NetFlow is a network protocol developed by Cisco for collecting IP traffic information and monitoring network traffic. It provides valuable data about network usage, performance, and security.',
        difficulty: 'intermediate',
        is_active: 1
      },
      // Network Security questions
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[3].id,
        question_text: 'Which type of attack involves an attacker intercepting and altering communications between two parties?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'DDoS attack',
          'Man-in-the-middle attack',
          'SQL injection',
          'Buffer overflow'
        ]),
        correct_answer: JSON.stringify(['Man-in-the-middle attack']),
        explanation: 'A man-in-the-middle (MITM) attack occurs when an attacker intercepts and potentially alters communications between two parties who believe they are directly communicating with each other.',
        difficulty: 'intermediate',
        is_active: 1
      },
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[3].id,
        question_text: 'What is the primary difference between IDS and IPS?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'IDS is hardware-based, IPS is software-based',
          'IDS detects and alerts, IPS detects and blocks',
          'IDS is faster than IPS',
          'IDS is more expensive than IPS'
        ]),
        correct_answer: JSON.stringify(['IDS detects and alerts, IPS detects and blocks']),
        explanation: 'The primary difference is that IDS (Intrusion Detection System) detects and alerts on suspicious activity, while IPS (Intrusion Prevention System) detects and actively blocks suspicious activity in real-time.',
        difficulty: 'intermediate',
        is_active: 1
      },
      // Network Troubleshooting questions
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[4].id,
        question_text: 'Which command would you use to test connectivity to a remote host and measure round-trip time?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'netstat',
          'ping',
          'ipconfig',
          'arp'
        ]),
        correct_answer: JSON.stringify(['ping']),
        explanation: 'The ping command uses ICMP echo requests to test connectivity to a remote host and measures the round-trip time (RTT) for packets to travel to the destination and back.',
        difficulty: 'beginner',
        is_active: 1
      },
      {
        id: generateId('qst'),
        exam_id: examId,
        objective_id: objectives[4].id,
        question_text: 'What does a Time to Live (TTL) expired message indicate?',
        question_type: 'multiple_choice',
        options: JSON.stringify([
          'The destination host is unreachable',
          'The packet has traversed too many hops',
          'The DNS server is not responding',
          'The network cable is disconnected'
        ]),
        correct_answer: JSON.stringify(['The packet has traversed too many hops']),
        explanation: 'A TTL expired message indicates that a packet has traversed the maximum number of hops (routers) allowed. Each router decrements the TTL by 1, and when it reaches 0, the packet is discarded to prevent routing loops.',
        difficulty: 'intermediate',
        is_active: 1
      }
    ]
    
    // Insert questions
    console.log('\nInserting questions...')
    for (const q of questions) {
      await db.execute({
        sql: `INSERT INTO questions (id, exam_id, objective_id, question_text, question_type, options, correct_answer, explanation, difficulty, is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [q.id, q.exam_id, q.objective_id, q.question_text, q.question_type, q.options, q.correct_answer, q.explanation, q.difficulty, q.is_active]
      })
      console.log(`  ✓ Added question: ${q.question_text.substring(0, 50)}...`)
    }
    
    console.log('\n✨ Successfully seeded N10-008 with:')
    console.log(`  - ${objectives.length} objectives`)
    console.log(`  - ${questions.length} sample questions`)
    
    await db.close()
  } catch (error) {
    console.error('Error seeding N10-008:', error)
    await db.close()
  }
}

seedN10008Questions()