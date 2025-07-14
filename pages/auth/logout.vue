<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

// Logout the user
onMounted(async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always redirect to home
    await navigateTo('/')
  }
})
</script>

<template>
  <div class="d-flex align-center justify-center" style="min-height: 100vh;">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>