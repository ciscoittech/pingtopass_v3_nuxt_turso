// Test script for chat functionality
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001'

// Test user chat endpoint
async function testUserChat() {
  console.log('Testing user chat...')
  
  try {
    // First, we need to authenticate (mock for now)
    const response = await fetch(`${BASE_URL}/api/chat/user/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me study for AWS certification?'
      })
    })
    
    const data = await response.json()
    console.log('User chat response:', data)
  } catch (error) {
    console.error('User chat error:', error.message)
  }
}

// Test admin chat endpoint
async function testAdminChat() {
  console.log('\nTesting admin chat...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat/admin/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'How many users do we have?',
        enableTools: true
      })
    })
    
    const data = await response.json()
    console.log('Admin chat response:', data)
  } catch (error) {
    console.error('Admin chat error:', error.message)
  }
}

// Test model settings endpoint
async function testModelSettings() {
  console.log('\nTesting model settings...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/models/index`)
    const data = await response.json()
    console.log('Model settings:', {
      currentSettings: Object.keys(data.currentSettings || {}),
      availableModels: data.availableModels?.length || 0
    })
  } catch (error) {
    console.error('Model settings error:', error.message)
  }
}

// Run tests
async function runTests() {
  console.log('Starting chat functionality tests...\n')
  await testUserChat()
  await testAdminChat()
  await testModelSettings()
  console.log('\nTests completed!')
}

runTests()