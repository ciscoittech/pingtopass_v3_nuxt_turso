<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Import Data</h1>
    <v-card>
      <v-card-text>
        <p>Import exam data from various sources.</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'default'
})
</script>