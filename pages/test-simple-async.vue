<template>
  <div>
    <h1>Simple Async Test</h1>
    <p>Data loading: {{ pending }}</p>
    <p>Error: {{ error }}</p>
    <pre v-if="data">{{ JSON.stringify(data, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
console.log('[Simple Async] Script setup running')

// Test a simple API call
const { data, pending, error } = useLazyFetch('/api/exams')

console.log('[Simple Async] Initial state:', { 
  data: data.value, 
  pending: pending.value, 
  error: error.value 
})

watch([data, pending, error], () => {
  console.log('[Simple Async] State changed:', {
    data: data.value,
    pending: pending.value,
    error: error.value
  })
})

onMounted(() => {
  console.log('[Simple Async] Component mounted')
})
</script>