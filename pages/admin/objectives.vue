<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Objectives Management</h1>
    <v-card>
      <v-card-text>
        <p>Manage exam objectives here.</p>
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