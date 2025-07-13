<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const examId = route.params.id as string

// Fetch exam details
const { data: examData, error } = await useFetch(`/api/exams/${examId}`)
const exam = computed(() => examData.value?.data)

// If exam not found, redirect to exams list
if (error.value || !exam.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Exam not found'
  })
}

// Navigation functions
const startStudyMode = () => {
  navigateTo(`/study/${examId}`)
}

const startTestMode = () => {
  navigateTo(`/test/${examId}`)
}
</script>

<template>
  <div>
    <!-- Back button -->
    <v-btn
      variant="text"
      color="primary"
      to="/exams"
      class="mb-4"
    >
      <v-icon start>mdi-arrow-left</v-icon>
      Back to Exams
    </v-btn>

    <!-- Exam Header -->
    <v-card flat class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="8">
            <h1 class="text-h3 font-weight-bold text-primary mb-2">
              {{ exam.examCode }}
            </h1>
            <h2 class="text-h5 text-grey-darken-2 mb-4">
              {{ exam.examName }}
            </h2>
            
            <v-chip-group>
              <v-chip prepend-icon="mdi-domain" color="primary" variant="tonal">
                {{ exam.vendorName }}
              </v-chip>
              <v-chip prepend-icon="mdi-help-circle">
                {{ exam.numberOfQuestions }} Questions
              </v-chip>
              <v-chip prepend-icon="mdi-clock-outline">
                {{ exam.examDuration }} Minutes
              </v-chip>
              <v-chip prepend-icon="mdi-percent">
                Pass: {{ exam.passingScore }}%
              </v-chip>
            </v-chip-group>
          </v-col>
          
          <v-col cols="12" md="4" class="text-md-end">
            <v-btn
              color="primary"
              size="large"
              block
              @click="startStudyMode"
              class="mb-2"
            >
              <v-icon start>mdi-book-open-variant</v-icon>
              Study Mode
            </v-btn>
            <v-btn
              color="secondary"
              size="large"
              block
              @click="startTestMode"
            >
              <v-icon start>mdi-clipboard-text</v-icon>
              Practice Test
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Exam Details -->
    <v-row>
      <!-- Overview -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Exam Overview</v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              {{ exam.description || 'Prepare for this certification exam with our comprehensive study materials and practice tests.' }}
            </p>
            
            <h3 class="text-h6 font-weight-bold mb-2">What You'll Learn</h3>
            <v-list density="compact">
              <v-list-item
                v-for="objective in exam.objectives || []"
                :key="objective.id"
                prepend-icon="mdi-check-circle"
              >
                <v-list-item-title>{{ objective.title }}</v-list-item-title>
                <v-list-item-subtitle v-if="objective.description">
                  {{ objective.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <!-- Placeholder if no objectives -->
            <v-alert
              v-if="!exam.objectives || exam.objectives.length === 0"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              Detailed objectives will be available soon.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Study Options -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Study Options</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item @click="startStudyMode">
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-book-open-variant</v-icon>
                </template>
                <v-list-item-title>Study Mode</v-list-item-title>
                <v-list-item-subtitle>
                  Practice questions with instant feedback
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item @click="startTestMode">
                <template v-slot:prepend>
                  <v-icon color="secondary">mdi-clipboard-text</v-icon>
                </template>
                <v-list-item-title>Practice Test</v-list-item-title>
                <v-list-item-subtitle>
                  Timed exam simulation
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Progress Card -->
        <v-card class="mt-4">
          <v-card-title>Your Progress</v-card-title>
          <v-card-text>
            <div class="text-center">
              <v-progress-circular
                :model-value="0"
                :size="100"
                :width="10"
                color="primary"
              >
                0%
              </v-progress-circular>
              <p class="text-body-2 mt-4 text-grey-darken-1">
                Start studying to track your progress
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>