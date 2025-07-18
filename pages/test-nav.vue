<template>
  <v-container>
    <v-card>
      <v-card-title>Navigation Test</v-card-title>
      <v-card-text>
        <v-btn color="primary" @click="testNavigation">
          Test Study Navigation
        </v-btn>
        
        <v-btn color="secondary" @click="directNavigation" class="ml-2">
          Direct Navigation (No Vue Router)
        </v-btn>
        
        <div v-if="error" class="mt-4">
          <v-alert type="error">{{ error }}</v-alert>
        </div>
        
        <div v-if="log.length > 0" class="mt-4">
          <h3>Log:</h3>
          <pre>{{ log.join('\n') }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
const log = ref([])
const error = ref('')

const testNavigation = async () => {
  log.value = []
  error.value = ''
  
  const examId = 'exm_1752676141404_bmxpdlbcn'
  
  try {
    log.value.push(`Testing navigation to /study/${examId}`)
    log.value.push(`Current route: ${useRoute().path}`)
    
    await navigateTo(`/study/${examId}`)
    log.value.push('Navigation completed')
  } catch (err) {
    error.value = err.message
    log.value.push(`Error: ${err.message}`)
  }
}

const directNavigation = () => {
  const examId = 'exm_1752676141404_bmxpdlbcn'
  window.location.href = `/study/${examId}`
}
</script>