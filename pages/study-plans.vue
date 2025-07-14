<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Study Plans</h1>
    <v-card>
      <v-card-text>
        <p>Manage your personalized study plans.</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})
</script>