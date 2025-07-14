<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Achievements</h1>
    <v-card>
      <v-card-text>
        <p>View your earned achievements and badges.</p>
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