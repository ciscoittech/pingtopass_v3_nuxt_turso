<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Settings</h1>
    <v-card>
      <v-card-text>
        <p>Configure your application settings.</p>
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