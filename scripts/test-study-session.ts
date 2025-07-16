import fetch from 'node-fetch'

async function testStudySession() {
  console.log('🧪 Testing study session start...\n')
  
  try {
    // First get a valid auth token (this would normally come from login)
    // For testing, we'll simulate this part
    
    const examId = 'exm_1752676142563_1mvuzpqby' // CCNA exam
    
    const response = await fetch('http://localhost:3000/api/sessions/study/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'd need a real auth token here
        'Cookie': 'auth-token=test'
      },
      body: JSON.stringify({
        examId: examId,
        mode: 'sequential',
        maxQuestions: 10,
        showExplanations: true,
        showTimer: true,
        autoAdvance: false
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error:', response.status, error)
      return
    }
    
    const data = await response.json()
    console.log('✅ Session created successfully!')
    console.log('Session ID:', data.data?.session?.id)
    console.log('Questions loaded:', data.data?.questions?.length)
    console.log('First question:', data.data?.questions?.[0]?.questionText?.substring(0, 80) + '...')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testStudySession()