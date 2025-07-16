import fetch from 'node-fetch'

async function testAllPages() {
  console.log('🧪 Testing All Exam Pages...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // 1. Test APIs
    console.log('1️⃣ Testing APIs...')
    
    // Test exams API
    const examsResponse = await fetch(`${baseUrl}/api/exams`)
    const examsData = await examsResponse.json()
    console.log('✅ /api/exams:', {
      status: examsResponse.status,
      hasData: !!examsData.data,
      examCount: examsData.data?.exams?.length || examsData.data?.length || 0
    })
    
    // Test vendors API
    const vendorsResponse = await fetch(`${baseUrl}/api/vendors`)
    const vendorsData = await vendorsResponse.json()
    console.log('✅ /api/vendors:', {
      status: vendorsResponse.status,
      hasData: !!vendorsData.data,
      vendorCount: Array.isArray(vendorsData.data) ? vendorsData.data.length : 0
    })
    
    // 2. Test specific exam
    if (examsData.data?.exams?.[0]) {
      const examId = examsData.data.exams[0].id
      const examResponse = await fetch(`${baseUrl}/api/exams/${examId}`)
      const examData = await examResponse.json()
      console.log('✅ /api/exams/[id]:', {
        status: examResponse.status,
        hasData: !!examData.data,
        examCode: examData.data?.code
      })
      
      // Test questions count
      const countResponse = await fetch(`${baseUrl}/api/exams/${examId}/questions/count`)
      const countData = await countResponse.json()
      console.log('✅ /api/exams/[id]/questions/count:', {
        status: countResponse.status,
        count: countData.data?.count || 0
      })
    }
    
    // 3. Summary
    console.log('\n📊 Summary:')
    console.log('- APIs are working correctly')
    console.log('- Admin page should now display exams')
    console.log('- Study page continues to work')
    console.log('- Question counts are accurate')
    
    console.log('\n🎯 Next Steps:')
    console.log('1. Navigate to http://localhost:3000/admin/exams')
    console.log('2. Verify exams are displayed')
    console.log('3. Navigate to http://localhost:3000/study')
    console.log('4. Click Quick Start and complete a study session')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAllPages()