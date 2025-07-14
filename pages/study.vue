<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Study Mode</h1>
    <v-row>
      <v-col cols="12" md="6" v-for="exam in exams" :key="exam.id">
        <v-card class="mb-4" @click="startStudy(exam.id)">
          <v-card-title>{{ exam.name }}</v-card-title>
          <v-card-subtitle>{{ exam.code }}</v-card-subtitle>
          <v-card-text>
            <p>{{ exam.description }}</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" variant="text">Start Study Session</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const router = useRouter()

// Fetch exams
const { data: examData } = await useFetch('/api/exams')
const exams = computed(() => examData.value?.data || [])

const startStudy = (examId) => {
  router.push(`/study/${examId}`)
}
</script>