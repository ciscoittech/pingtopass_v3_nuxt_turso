<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { data: examsData } = await useFetch('/api/exams')
const { data: objectivesData } = await useFetch('/api/objectives', {
  query: { examId: 'test' }
})
</script>

<template>
  <div>
    <v-container>
      <h1>API Test Page</h1>
      
      <v-card class="mb-4">
        <v-card-title>Exams API Response</v-card-title>
        <v-card-text>
          <pre>{{ JSON.stringify(examsData, null, 2) }}</pre>
        </v-card-text>
      </v-card>
      
      <v-card>
        <v-card-title>Objectives API Response (test exam)</v-card-title>
        <v-card-text>
          <pre>{{ JSON.stringify(objectivesData, null, 2) }}</pre>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>