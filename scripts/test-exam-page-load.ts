import fetch from 'node-fetch'

async function testExamPageLoad() {
  console.log('🔍 Testing Exam Page Load Issue...\n')
  
  const examIds = [
    'exm_1752676141404_bmxpdlbcn', // Linux+
    'exm_1752676144431_h3201ctmt'  // AWS
  ]
  
  for (const examId of examIds) {
    console.log(`\n📋 Testing exam: ${examId}`)
    
    try {
      // Test the API directly
      const response = await fetch(`http://localhost:3000/api/exams/${examId}`)
      const data = await response.json()
      
      console.log('API Response:')
      console.log('- Status:', response.status)
      console.log('- Success:', data.success)
      console.log('- Has data:', !!data.data)
      console.log('- Exam code:', data.data?.code)
      
      // Check what might be wrong
      if (!data.success || !data.data) {
        console.log('❌ Issue: API not returning data properly')
      }
      
    } catch (error) {
      console.error('❌ API Error:', error)
    }
  }
  
  console.log('\n🔍 Potential Issues:')
  console.log('1. SSR issue - the page throws an error during server-side rendering')
  console.log('2. The immediate check for !exam.value happens before data loads')
  console.log('3. Auth middleware might be interfering')
  
  console.log('\n💡 The page might be stuck because:')
  console.log('- It throws a 404 error during SSR if exam data is not immediately available')
  console.log('- The error prevents the page from rendering')
  console.log('- The navigation happens but the page component fails to mount')
  
  console.log('\n🛠️ Suggested Fix:')
  console.log('- Remove the immediate error check')
  console.log('- Let the page render and handle loading state')
  console.log('- Show loading spinner while data loads')
}

testExamPageLoad()