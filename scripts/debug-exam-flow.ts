import fetch from 'node-fetch'

async function debugExamFlow() {
  console.log('🔍 Debugging Exam Data Flow...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // 1. Test /api/exams endpoint (used by both pages)
    console.log('1️⃣ Testing /api/exams endpoint...')
    const examsResponse = await fetch(`${baseUrl}/api/exams`)
    const examsData = await examsResponse.json()
    
    console.log('Response structure:')
    console.log('- success:', examsData.success)
    console.log('- data type:', typeof examsData.data)
    console.log('- data is array?:', Array.isArray(examsData.data))
    
    if (examsData.data && typeof examsData.data === 'object') {
      console.log('- data keys:', Object.keys(examsData.data))
      if (examsData.data.exams) {
        console.log('- data.exams is array?:', Array.isArray(examsData.data.exams))
        console.log('- data.exams length:', examsData.data.exams.length)
        console.log('- First exam:', examsData.data.exams[0])
      }
    }
    
    // 2. Test if there are multiple endpoints
    console.log('\n2️⃣ Testing /api/exams/index endpoint...')
    try {
      const indexResponse = await fetch(`${baseUrl}/api/exams/index`)
      const indexData = await indexResponse.json()
      console.log('Response received:', indexResponse.status)
      console.log('Data type:', typeof indexData.data)
    } catch (error) {
      console.log('No /api/exams/index endpoint (expected)')
    }
    
    // 3. Test specific exam fetch
    console.log('\n3️⃣ Testing specific exam fetch...')
    if (examsData.data?.exams?.[0]) {
      const examId = examsData.data.exams[0].id
      console.log(`Fetching exam: ${examId}`)
      
      const examResponse = await fetch(`${baseUrl}/api/exams/${examId}`)
      const examData = await examResponse.json()
      
      console.log('Response status:', examResponse.status)
      console.log('Success:', examData.success)
      console.log('Has data:', !!examData.data)
      console.log('Exam properties:', examData.data ? Object.keys(examData.data) : 'N/A')
    }
    
    // 4. Check what the admin page expects
    console.log('\n4️⃣ Admin page expectations:')
    console.log('- Expects: examsData.value?.data to be an array')
    console.log('- Actual: examsData.data is', typeof examsData.data)
    console.log('- Fix needed: Check for data.exams array')
    
    // 5. Check what the study page does
    console.log('\n5️⃣ Study page handling:')
    console.log('- Has fallback: checks both data (array) and data.exams (nested)')
    console.log('- This is why study page works but admin doesn\'t')
    
    console.log('\n📊 Summary:')
    console.log('- API returns: { data: { exams: [...], total, page, ... } }')
    console.log('- Admin expects: { data: [...] }')
    console.log('- Study handles both formats correctly')
    console.log('\n✅ Solution: Update admin page to check for data.exams like study page does')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugExamFlow()