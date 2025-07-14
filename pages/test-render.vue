<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<template>
  <div style="padding: 20px; background: #f0f5f9; min-height: 100vh;">
    <h1>Basic Render Test</h1>
    <p>If you see this, Vue is rendering correctly.</p>
    <p>Time: {{ new Date().toLocaleTimeString() }}</p>
    <v-btn color="primary" @click="$router.push('/')">Go Home</v-btn>
  </div>
</template>