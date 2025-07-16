import fetch from 'node-fetch'

async function debugStudyPage() {
  console.log('🔍 Debugging Study Page Load...\n')
  
  const examId = 'exm_1752676144431_h3201ctmt'
  const baseUrl = 'http://localhost:3000'
  
  try {
    // 1. Test if the exam exists
    console.log('1️⃣ Testing exam API...')
    const examResponse = await fetch(`${baseUrl}/api/exams/${examId}`)
    const examData = await examResponse.json()
    console.log('Exam found:', examData.success)
    console.log('Exam code:', examData.data?.code)
    console.log('Exam name:', examData.data?.name)
    
    // 2. Test questions count
    console.log('\n2️⃣ Testing questions count...')
    const countResponse = await fetch(`${baseUrl}/api/exams/${examId}/questions/count`)
    const countData = await countResponse.json()
    console.log('Questions count:', countData.data?.count)
    
    // 3. Test if page requires auth
    console.log('\n3️⃣ Testing page access...')
    const pageResponse = await fetch(`${baseUrl}/study/${examId}`, {
      headers: {
        'Accept': 'text/html',
      },
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log('Page status:', pageResponse.status)
    console.log('Page type:', pageResponse.headers.get('content-type'))
    
    if (pageResponse.status === 302 || pageResponse.status === 301) {
      console.log('Redirect to:', pageResponse.headers.get('location'))
      console.log('⚠️  Page is redirecting - likely authentication required')
    }
    
    // 4. Check what the page expects
    console.log('\n4️⃣ Page Requirements:')
    console.log('- Requires authentication (middleware: "auth")')
    console.log('- Fetches exam data')
    console.log('- Fetches questions count')
    console.log('- Shows StudyModeConfig component to configure session')
    console.log('- After configuration, starts study session')
    
    console.log('\n📊 Possible Issues:')
    console.log('1. Not authenticated - page redirects to login')
    console.log('2. Page is loading but stuck on configuration screen')
    console.log('3. JavaScript error preventing interaction')
    
    console.log('\n🎯 To Debug:')
    console.log('1. Open browser DevTools (F12)')
    console.log('2. Check Console for errors')
    console.log('3. Check Network tab for failed requests')
    console.log('4. Look for authentication redirects')
    console.log('5. Check if StudyModeConfig component is visible')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugStudyPage()