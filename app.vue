<script setup lang="ts">
// Add error boundary for debugging
onErrorCaptured((error) => {
  console.error('App error:', error)
  return false
})
</script>

<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
