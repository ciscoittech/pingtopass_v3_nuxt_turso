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

// Comprehensive vendor and exam data
const vendorData = [
  {
    name: 'CompTIA',
    description: 'Leading provider of vendor-neutral IT certifications',
    website: 'https://www.comptia.org/certifications',
    exams: [
      {
        code: 'SY0-701',
        name: 'CompTIA Security+',
        description: 'Global certification that validates baseline skills for performing core security functions',
        passingScore: 75,
        duration: 90,
        questionCount: 90,
        price: 392,
        objectives: [
          {
            title: 'General Security Concepts',
            description: 'Security controls, fundamental security concepts, and cryptography basics',
            weight: 12
          },
          {
            title: 'Threats, Vulnerabilities, and Mitigations',
            description: 'Threat actors, vectors, vulnerabilities, and mitigation techniques',
            weight: 22
          },
          {
            title: 'Security Architecture',
            description: 'Enterprise infrastructure security, cloud security, and security implications',
            weight: 18
          },
          {
            title: 'Security Operations',
            description: 'Logging, monitoring, incident response, and digital forensics',
            weight: 28
          },
          {
            title: 'Security Program Management and Oversight',
            description: 'Governance, risk management, compliance, and privacy',
            weight: 20
          }
        ]
      },
      {
        code: '220-1101',
        name: 'CompTIA A+ Core 1',
        description: 'Covers mobile devices, networking technology, hardware, virtualization and cloud computing',
        passingScore: 67.5,
        duration: 90,
        questionCount: 90,
        price: 239,
        objectives: [
          {
            title: 'Mobile Devices',
            description: 'Laptop hardware, mobile device accessories, and network connectivity',
            weight: 15
          },
          {
            title: 'Networking',
            description: 'TCP/IP, ports, protocols, networking hardware, and wireless standards',
            weight: 20
          },
          {
            title: 'Hardware',
            description: 'Basic cable types, RAM, storage devices, motherboards, CPUs, and power supplies',
            weight: 25
          },
          {
            title: 'Virtualization and Cloud Computing',
            description: 'Cloud concepts, client-side virtualization, and cloud characteristics',
            weight: 11
          },
          {
            title: 'Hardware and Network Troubleshooting',
            description: 'Best practices for resolving hardware and network issues',
            weight: 29
          }
        ]
      },
      {
        code: 'N10-008',
        name: 'CompTIA Network+',
        description: 'Validates essential knowledge and skills to configure, manage, and troubleshoot networks',
        passingScore: 72,
        duration: 90,
        questionCount: 90,
        price: 338,
        objectives: [
          {
            title: 'Networking Fundamentals',
            description: 'OSI model, network topologies, cable types, IP addressing, and ports',
            weight: 24
          },
          {
            title: 'Network Implementations',
            description: 'Routing and switching, wireless standards, and network services',
            weight: 19
          },
          {
            title: 'Network Operations',
            description: 'Documentation, policies, business continuity, and disaster recovery',
            weight: 16
          },
          {
            title: 'Network Security',
            description: 'Physical security, authentication, access control, and wireless security',
            weight: 19
          },
          {
            title: 'Network Troubleshooting',
            description: 'Network troubleshooting methodology, tools, and common issues',
            weight: 22
          }
        ]
      }
    ]
  },
  {
    name: 'Microsoft',
    description: 'Global technology leader offering Azure cloud and Microsoft 365 certifications',
    website: 'https://learn.microsoft.com/certifications/',
    exams: [
      {
        code: 'AZ-900',
        name: 'Microsoft Azure Fundamentals',
        description: 'Demonstrates foundational knowledge of cloud concepts and Azure services',
        passingScore: 70,
        duration: 85,
        questionCount: 60,
        price: 99,
        objectives: [
          {
            title: 'Describe cloud concepts',
            description: 'Cloud computing, benefits of cloud services, and cloud service types',
            weight: 25
          },
          {
            title: 'Describe Azure architecture and services',
            description: 'Core Azure architectural components, compute, networking, and storage',
            weight: 35
          },
          {
            title: 'Describe Azure management and governance',
            description: 'Cost management, SLAs, service lifecycle, and governance features',
            weight: 30
          },
          {
            title: 'Describe Azure security and compliance',
            description: 'Security features, network security, identity, governance, and compliance',
            weight: 10
          }
        ]
      },
      {
        code: 'AZ-104',
        name: 'Microsoft Azure Administrator',
        description: 'Implementing, managing, and monitoring an organization\'s Azure environment',
        passingScore: 70,
        duration: 120,
        questionCount: 60,
        price: 165,
        objectives: [
          {
            title: 'Manage Azure identities and governance',
            description: 'Azure AD, users, groups, subscriptions, RBAC, and policies',
            weight: 20
          },
          {
            title: 'Implement and manage storage',
            description: 'Storage accounts, blob storage, file shares, and storage security',
            weight: 15
          },
          {
            title: 'Deploy and manage Azure compute resources',
            description: 'Virtual machines, containers, app services, and Azure Kubernetes Service',
            weight: 20
          },
          {
            title: 'Implement and manage virtual networking',
            description: 'Virtual networks, load balancing, network security, and monitoring',
            weight: 25
          },
          {
            title: 'Monitor and maintain Azure resources',
            description: 'Azure Monitor, backup, disaster recovery, and performance tuning',
            weight: 20
          }
        ]
      },
      {
        code: 'MS-900',
        name: 'Microsoft 365 Fundamentals',
        description: 'Foundational knowledge on productivity, collaboration, and cloud services',
        passingScore: 70,
        duration: 60,
        questionCount: 60,
        price: 99,
        objectives: [
          {
            title: 'Describe cloud concepts',
            description: 'Principles of cloud computing and Microsoft cloud services',
            weight: 10
          },
          {
            title: 'Describe Microsoft 365 apps and services',
            description: 'Microsoft 365 productivity solutions and teamwork capabilities',
            weight: 45
          },
          {
            title: 'Describe Microsoft 365 security and compliance',
            description: 'Security, compliance, privacy, and trust in Microsoft 365',
            weight: 25
          },
          {
            title: 'Describe Microsoft 365 pricing and support',
            description: 'Licensing options, billing, and support offerings',
            weight: 20
          }
        ]
      }
    ]
  },
  {
    name: 'Amazon Web Services',
    description: 'Leading cloud computing platform provider with comprehensive certification paths',
    website: 'https://aws.amazon.com/certification/',
    exams: [
      {
        code: 'CLF-C02',
        name: 'AWS Certified Cloud Practitioner',
        description: 'Validates overall understanding of the AWS Cloud',
        passingScore: 70,
        duration: 90,
        questionCount: 65,
        price: 100,
        objectives: [
          {
            title: 'Cloud Concepts',
            description: 'AWS Cloud value proposition, cloud economics, and design principles',
            weight: 24
          },
          {
            title: 'Security and Compliance',
            description: 'Shared responsibility model, security capabilities, and compliance',
            weight: 30
          },
          {
            title: 'Cloud Technology and Services',
            description: 'Compute, storage, networking, databases, and analytics services',
            weight: 34
          },
          {
            title: 'Billing, Pricing, and Support',
            description: 'Pricing models, account structures, and support resources',
            weight: 12
          }
        ]
      },
      {
        code: 'SAA-C03',
        name: 'AWS Certified Solutions Architect - Associate',
        description: 'Designing distributed systems and applications on AWS',
        passingScore: 72,
        duration: 130,
        questionCount: 65,
        price: 150,
        objectives: [
          {
            title: 'Design Secure Architectures',
            description: 'Secure access to AWS resources, secure workloads and applications',
            weight: 30
          },
          {
            title: 'Design Resilient Architectures',
            description: 'Reliable and resilient workloads, high availability and fault tolerance',
            weight: 26
          },
          {
            title: 'Design High-Performing Architectures',
            description: 'High-performing and scalable workloads, data solutions',
            weight: 24
          },
          {
            title: 'Design Cost-Optimized Architectures',
            description: 'Cost-effective resources, data transfer and storage strategies',
            weight: 20
          }
        ]
      },
      {
        code: 'DVA-C02',
        name: 'AWS Certified Developer - Associate',
        description: 'Developing and maintaining applications on AWS',
        passingScore: 72,
        duration: 130,
        questionCount: 65,
        price: 150,
        objectives: [
          {
            title: 'Development with AWS Services',
            description: 'Developing code for applications using AWS services',
            weight: 32
          },
          {
            title: 'Security',
            description: 'Authentication, encryption, and application security',
            weight: 26
          },
          {
            title: 'Deployment',
            description: 'Preparing application code for deployment and CI/CD pipelines',
            weight: 24
          },
          {
            title: 'Troubleshooting and Optimization',
            description: 'Code optimization, monitoring, and troubleshooting',
            weight: 18
          }
        ]
      }
    ]
  },
  {
    name: 'Cisco',
    description: 'Global leader in networking technology certifications',
    website: 'https://www.cisco.com/c/en/us/training-events/training-certifications.html',
    exams: [
      {
        code: '200-301',
        name: 'Cisco Certified Network Associate (CCNA)',
        description: 'Validates knowledge of network fundamentals, security, automation, and programmability',
        passingScore: 82.5,
        duration: 120,
        questionCount: 100,
        price: 300,
        objectives: [
          {
            title: 'Network Fundamentals',
            description: 'Network components, topology, cabling, TCP/IP, and IPv6',
            weight: 20
          },
          {
            title: 'Network Access',
            description: 'Configure and verify VLANs, interswitch connectivity, and Layer 2 protocols',
            weight: 20
          },
          {
            title: 'IP Connectivity',
            description: 'Routing protocols, first hop redundancy protocols, and routing tables',
            weight: 25
          },
          {
            title: 'IP Services',
            description: 'NAT, NTP, DHCP, DNS, SNMP, and QoS',
            weight: 10
          },
          {
            title: 'Security Fundamentals',
            description: 'Security concepts, device access control, and VPNs',
            weight: 15
          },
          {
            title: 'Automation and Programmability',
            description: 'Automation impacts, APIs, configuration management, and SDN',
            weight: 10
          }
        ]
      },
      {
        code: '200-901',
        name: 'Cisco DevNet Associate',
        description: 'Software development and design for Cisco platforms',
        passingScore: 82.5,
        duration: 120,
        questionCount: 100,
        price: 300,
        objectives: [
          {
            title: 'Software Development and Design',
            description: 'Software development lifecycle, design patterns, and version control',
            weight: 15
          },
          {
            title: 'Understanding and Using APIs',
            description: 'REST APIs, webhooks, API authentication, and API design',
            weight: 20
          },
          {
            title: 'Cisco Platforms and Development',
            description: 'Cisco platforms, APIs, SDKs, and programmability',
            weight: 15
          },
          {
            title: 'Application Deployment and Security',
            description: 'CI/CD, security, containers, and edge computing',
            weight: 15
          },
          {
            title: 'Infrastructure and Automation',
            description: 'Infrastructure as code, automation tools, and device programmability',
            weight: 20
          },
          {
            title: 'Network Fundamentals',
            description: 'Networking concepts, troubleshooting, and network programmability',
            weight: 15
          }
        ]
      }
    ]
  },
  {
    name: 'VMware',
    description: 'Leader in virtualization and cloud infrastructure certifications',
    website: 'https://www.vmware.com/certification.html',
    exams: [
      {
        code: '2V0-21.23',
        name: 'VMware vSphere 8.x Professional',
        description: 'Validates skills in installing, configuring, and managing vSphere 8.x',
        passingScore: 30,
        duration: 135,
        questionCount: 70,
        price: 250,
        objectives: [
          {
            title: 'vSphere Architecture and Technologies',
            description: 'vSphere components, storage, networking, and virtual machines',
            weight: 25
          },
          {
            title: 'Installing and Configuring vSphere',
            description: 'ESXi installation, vCenter deployment, and initial configuration',
            weight: 20
          },
          {
            title: 'Managing vSphere Resources',
            description: 'Resource pools, DRS, HA, and vMotion configuration',
            weight: 30
          },
          {
            title: 'Troubleshooting vSphere',
            description: 'Monitoring tools, log analysis, and common issues',
            weight: 25
          }
        ]
      },
      {
        code: '5V0-23.20',
        name: 'VMware vSAN Specialist',
        description: 'Validates expertise in deploying and administering VMware vSAN',
        passingScore: 30,
        duration: 125,
        questionCount: 60,
        price: 250,
        objectives: [
          {
            title: 'vSAN Architecture',
            description: 'vSAN components, disk groups, and cluster configuration',
            weight: 30
          },
          {
            title: 'vSAN Operations',
            description: 'Storage policies, maintenance mode, and capacity management',
            weight: 35
          },
          {
            title: 'vSAN Troubleshooting',
            description: 'Health monitoring, performance analysis, and issue resolution',
            weight: 35
          }
        ]
      }
    ]
  },
  {
    name: 'Oracle',
    description: 'Enterprise software and database technology certifications',
    website: 'https://education.oracle.com/certification',
    exams: [
      {
        code: '1Z0-071',
        name: 'Oracle Database SQL Certified Associate',
        description: 'Fundamental understanding of SQL and its use with Oracle Database',
        passingScore: 63,
        duration: 120,
        questionCount: 78,
        price: 245,
        objectives: [
          {
            title: 'Relational Database Concepts',
            description: 'Database concepts, SQL statements, and data types',
            weight: 15
          },
          {
            title: 'Using SQL SELECT Statements',
            description: 'Basic SELECT, filtering, sorting, and single-row functions',
            weight: 25
          },
          {
            title: 'Using Joins and Subqueries',
            description: 'Join types, subqueries, and set operators',
            weight: 25
          },
          {
            title: 'Using DDL Statements',
            description: 'CREATE, ALTER, DROP statements, and constraints',
            weight: 20
          },
          {
            title: 'Using DML and Transactions',
            description: 'INSERT, UPDATE, DELETE, and transaction control',
            weight: 15
          }
        ]
      },
      {
        code: '1Z0-149',
        name: 'Oracle Database PL/SQL Developer Certified Professional',
        description: 'Building database-centric Internet applications using PL/SQL',
        passingScore: 65,
        duration: 130,
        questionCount: 65,
        price: 245,
        objectives: [
          {
            title: 'PL/SQL Fundamentals',
            description: 'PL/SQL blocks, variables, and program units',
            weight: 25
          },
          {
            title: 'Program Structures',
            description: 'Procedures, functions, packages, and triggers',
            weight: 30
          },
          {
            title: 'Error Handling',
            description: 'Exception handling and debugging techniques',
            weight: 20
          },
          {
            title: 'Advanced Features',
            description: 'Collections, bulk processing, and dynamic SQL',
            weight: 25
          }
        ]
      }
    ]
  },
  {
    name: 'Google Cloud',
    description: 'Google Cloud Platform certification provider',
    website: 'https://cloud.google.com/certification',
    exams: [
      {
        code: 'Cloud Digital Leader',
        name: 'Google Cloud Digital Leader',
        description: 'Foundational knowledge of cloud concepts and Google Cloud products',
        passingScore: 70,
        duration: 90,
        questionCount: 60,
        price: 99,
        objectives: [
          {
            title: 'Digital Transformation with Google Cloud',
            description: 'Cloud concepts, benefits, and transformation strategies',
            weight: 20
          },
          {
            title: 'Innovating with Data and Google Cloud',
            description: 'Data management, analytics, and machine learning basics',
            weight: 30
          },
          {
            title: 'Infrastructure Modernization',
            description: 'Compute options, modernization approaches, and containers',
            weight: 30
          },
          {
            title: 'Security and Operations',
            description: 'Cloud security, compliance, and operational excellence',
            weight: 20
          }
        ]
      },
      {
        code: 'ACE',
        name: 'Google Cloud Associate Cloud Engineer',
        description: 'Deploy applications, monitor operations, and manage enterprise solutions',
        passingScore: 70,
        duration: 120,
        questionCount: 50,
        price: 125,
        objectives: [
          {
            title: 'Setting up a cloud solution environment',
            description: 'Projects, billing, IAM, and enabling APIs',
            weight: 20
          },
          {
            title: 'Planning and configuring a cloud solution',
            description: 'Compute resources, storage, networking, and data solutions',
            weight: 25
          },
          {
            title: 'Deploying and implementing solutions',
            description: 'Compute Engine, Kubernetes Engine, App Engine, and Cloud Functions',
            weight: 25
          },
          {
            title: 'Ensuring successful operations',
            description: 'Monitoring, logging, diagnostics, and managing resources',
            weight: 20
          },
          {
            title: 'Configuring access and security',
            description: 'IAM, service accounts, network security, and data protection',
            weight: 10
          }
        ]
      }
    ]
  }
]

async function seedComprehensiveData() {
  console.log('🌱 Seeding comprehensive vendor, exam, and objective data...\n')

  try {
    // First, check existing data
    const existingVendors = await db.execute('SELECT COUNT(*) as count FROM vendors')
    const existingExams = await db.execute('SELECT COUNT(*) as count FROM exams')
    const existingObjectives = await db.execute('SELECT COUNT(*) as count FROM objectives')
    
    console.log('📊 Current database state:')
    console.log(`  - Vendors: ${existingVendors.rows[0].count}`)
    console.log(`  - Exams: ${existingExams.rows[0].count}`)
    console.log(`  - Objectives: ${existingObjectives.rows[0].count}\n`)

    let vendorsAdded = 0
    let examsAdded = 0
    let objectivesAdded = 0

    // Process each vendor
    for (const vendor of vendorData) {
      // Check if vendor exists
      const existingVendor = await db.execute({
        sql: 'SELECT id FROM vendors WHERE name = ?',
        args: [vendor.name]
      })

      let vendorId: string
      if (existingVendor.rows.length > 0) {
        vendorId = existingVendor.rows[0].id as string
        console.log(`✓ Vendor already exists: ${vendor.name}`)
      } else {
        vendorId = generateId('vendor')
        await db.execute({
          sql: 'INSERT INTO vendors (id, name, description, website) VALUES (?, ?, ?, ?)',
          args: [vendorId, vendor.name, vendor.description, vendor.website]
        })
        console.log(`✅ Added vendor: ${vendor.name}`)
        vendorsAdded++
      }

      // Process exams for this vendor
      for (const exam of vendor.exams) {
        // Check if exam exists
        const existingExam = await db.execute({
          sql: 'SELECT id FROM exams WHERE code = ?',
          args: [exam.code]
        })

        let examId: string
        if (existingExam.rows.length > 0) {
          examId = existingExam.rows[0].id as string
          console.log(`  ✓ Exam already exists: ${exam.code}`)
        } else {
          examId = generateId('exam')
          await db.execute({
            sql: `INSERT INTO exams (id, vendor_id, code, name, description, passing_score, duration, 
                  question_count, price, is_active) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [examId, vendorId, exam.code, exam.name, exam.description, 
                   exam.passingScore, exam.duration, exam.questionCount, exam.price, 
                   1]
          })
          console.log(`  ✅ Added exam: ${exam.code} - ${exam.name}`)
          examsAdded++

          // Add objectives for new exam
          let displayOrder = 1
          for (const objective of exam.objectives) {
            const objectiveId = generateId('obj')
            await db.execute({
              sql: `INSERT INTO objectives (id, exam_id, number, title, description, weight) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
              args: [objectiveId, examId, `${exam.code}-OBJ-${displayOrder}`, objective.title, objective.description, 
                     objective.weight]
            })
            displayOrder++
            objectivesAdded++
          }
          console.log(`    ✅ Added ${exam.objectives.length} objectives`)
        }
      }
      console.log('') // Empty line between vendors
    }

    // Final summary
    console.log('\n✨ Seeding complete!\n')
    console.log('📊 Summary of changes:')
    console.log(`  - Vendors added: ${vendorsAdded}`)
    console.log(`  - Exams added: ${examsAdded}`)
    console.log(`  - Objectives added: ${objectivesAdded}`)

    // Show final counts
    const finalVendors = await db.execute('SELECT COUNT(*) as count FROM vendors')
    const finalExams = await db.execute('SELECT COUNT(*) as count FROM exams')
    const finalObjectives = await db.execute('SELECT COUNT(*) as count FROM objectives')
    
    console.log('\n📊 Final database state:')
    console.log(`  - Total vendors: ${finalVendors.rows[0].count}`)
    console.log(`  - Total exams: ${finalExams.rows[0].count}`)
    console.log(`  - Total objectives: ${finalObjectives.rows[0].count}`)

    // Show a sample of what's available
    console.log('\n📋 Sample data available:')
    const sampleVendors = await db.execute('SELECT name FROM vendors LIMIT 5')
    console.log('Vendors:')
    sampleVendors.rows.forEach(v => console.log(`  - ${v.name}`))
    
    const sampleExams = await db.execute('SELECT code, name FROM exams LIMIT 5')
    console.log('\nExams:')
    sampleExams.rows.forEach(e => console.log(`  - ${e.code}: ${e.name}`))

  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    await db.close()
  }
}

// Run the seeder
seedComprehensiveData()