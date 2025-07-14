import fetch from 'node-fetch'

async function testAPIEndpoints() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing API endpoints...\n')
  
  // Test public endpoints
  const publicEndpoints = [
    '/api/exams',
    '/api/vendors',
    '/api/exams/popular'
  ]
  
  for (const endpoint of publicEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`)
        if (data.data && Array.isArray(data.data)) {
          console.log(`   Found ${data.data.length} items`)
        }
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`)
        console.log(`   Error: ${JSON.stringify(data)}`)
      }
    } catch (error: any) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log('The API endpoints should be accessible.')
  console.log('If you\'re getting 404 errors, the routes may not be properly registered.')
}

testAPIEndpoints()