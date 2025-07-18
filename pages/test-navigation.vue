<template>
  <div class="pa-4">
    <h1>Navigation Test Page</h1>
    
    <v-card class="mb-4">
      <v-card-title>Test Different Navigation Methods</v-card-title>
      <v-card-text>
        <p>Current Route: {{ $route.path }}</p>
        <p>Navigation State: {{ navigationState }}</p>
      </v-card-text>
    </v-card>
    
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>navigateTo Method</v-card-title>
          <v-card-text>
            <v-btn @click="testNavigateTo" :loading="loading1" color="primary" class="mb-2">
              Test navigateTo
            </v-btn>
            <div v-if="result1">Result: {{ result1 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>router.push Method</v-card-title>
          <v-card-text>
            <v-btn @click="testRouterPush" :loading="loading2" color="secondary" class="mb-2">
              Test router.push
            </v-btn>
            <div v-if="result2">Result: {{ result2 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>window.location Method</v-card-title>
          <v-card-text>
            <v-btn @click="testWindowLocation" color="warning" class="mb-2">
              Test window.location
            </v-btn>
            <div v-if="result3">Result: {{ result3 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>NuxtLink Component</v-card-title>
          <v-card-text>
            <NuxtLink to="/study/exm_1752676144431_h3201ctmt-fixed">
              <v-btn color="success" class="mb-2">
                Test NuxtLink
              </v-btn>
            </NuxtLink>
            <div>Using standard link component</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-card class="mt-4">
      <v-card-title>Console Output</v-card-title>
      <v-card-text>
        <pre>{{ consoleOutput }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const navigationState = ref('idle')
const loading1 = ref(false)
const loading2 = ref(false)
const result1 = ref('')
const result2 = ref('')
const result3 = ref('')
const consoleOutput = ref('')

const log = (message: string) => {
  const timestamp = new Date().toISOString()
  consoleOutput.value += `[${timestamp}] ${message}\n`
  console.log(message)
}

// Test navigateTo
async function testNavigateTo() {
  loading1.value = true
  navigationState.value = 'navigating with navigateTo'
  result1.value = ''
  
  try {
    log('Starting navigateTo test...')
    const start = performance.now()
    
    await navigateTo('/study/exm_1752676144431_h3201ctmt-fixed')
    
    const duration = performance.now() - start
    result1.value = `Success in ${duration.toFixed(2)}ms`
    log(`navigateTo completed in ${duration.toFixed(2)}ms`)
  } catch (error) {
    result1.value = `Error: ${error}`
    log(`navigateTo error: ${error}`)
  } finally {
    loading1.value = false
    navigationState.value = 'idle'
  }
}

// Test router.push
async function testRouterPush() {
  loading2.value = true
  navigationState.value = 'navigating with router.push'
  result2.value = ''
  
  try {
    log('Starting router.push test...')
    const start = performance.now()
    
    await router.push('/study/exm_1752676144431_h3201ctmt-fixed')
    
    const duration = performance.now() - start
    result2.value = `Success in ${duration.toFixed(2)}ms`
    log(`router.push completed in ${duration.toFixed(2)}ms`)
  } catch (error) {
    result2.value = `Error: ${error}`
    log(`router.push error: ${error}`)
  } finally {
    loading2.value = false
    navigationState.value = 'idle'
  }
}

// Test window.location
function testWindowLocation() {
  navigationState.value = 'navigating with window.location'
  result3.value = 'Redirecting...'
  log('Starting window.location redirect...')
  
  // This will do a hard redirect
  window.location.href = '/study/exm_1752676144431_h3201ctmt-fixed'
}

// Watch route changes
watch(() => route.path, (newPath) => {
  log(`Route changed to: ${newPath}`)
})

onMounted(() => {
  log('Test navigation page mounted')
})
</script>