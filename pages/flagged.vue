<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Flagged Questions</h1>
    <v-card>
      <v-card-text>
        <p>Review your flagged questions for later study.</p>
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