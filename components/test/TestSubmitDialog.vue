<script setup lang="ts">
interface Props {
  modelValue: boolean
  totalQuestions: number
  answeredQuestions: number
  timeRemaining: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const unansweredQuestions = computed(() => {
  return props.totalQuestions - props.answeredQuestions
})

const completionPercentage = computed(() => {
  return Math.round((props.answeredQuestions / props.totalQuestions) * 100)
})

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const hasUnansweredQuestions = computed(() => {
  return unansweredQuestions.value > 0
})

const submitTest = () => {
  emit('submit')
}

const getWarningMessage = () => {
  if (unansweredQuestions.value > 0) {
    return `You have ${unansweredQuestions.value} unanswered questions. These will be marked as incorrect.`
  }
  return null
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon 
          :color="hasUnansweredQuestions ? 'warning' : 'success'" 
          class="mr-2"
        >
          {{ hasUnansweredQuestions ? 'mdi-alert' : 'mdi-check-circle' }}
        </v-icon>
        Submit Test
      </v-card-title>
      
      <v-card-text>
        <div class="submission-summary">
          <!-- Progress Overview -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text class="pa-4">
              <h4 class="text-subtitle-1 mb-3">Test Progress</h4>
              
              <div class="progress-stats mb-3">
                <v-row>
                  <v-col cols="6">
                    <div class="stat-item">
                      <div class="stat-value text-h5 text-success">
                        {{ answeredQuestions }}
                      </div>
                      <div class="stat-label text-caption text-grey-darken-1">
                        Answered
                      </div>
                    </div>
                  </v-col>
                  
                  <v-col cols="6">
                    <div class="stat-item">
                      <div class="stat-value text-h5" :class="hasUnansweredQuestions ? 'text-warning' : 'text-grey'">
                        {{ unansweredQuestions }}
                      </div>
                      <div class="stat-label text-caption text-grey-darken-1">
                        Unanswered
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>
              
              <v-progress-linear
                :model-value="completionPercentage"
                :color="hasUnansweredQuestions ? 'warning' : 'success'"
                height="8"
                rounded
                class="mb-2"
              />
              
              <div class="d-flex justify-space-between">
                <span class="text-caption">{{ completionPercentage }}% Complete</span>
                <span class="text-caption">{{ totalQuestions }} Total Questions</span>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Time Remaining -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text class="pa-4">
              <div class="d-flex align-center">
                <v-icon 
                  :color="timeRemaining < 300 ? 'error' : 'primary'" 
                  class="mr-3"
                >
                  mdi-clock-outline
                </v-icon>
                <div>
                  <div class="text-subtitle-2">Time Remaining</div>
                  <div 
                    class="text-h6"
                    :class="timeRemaining < 300 ? 'text-error' : 'text-primary'"
                  >
                    {{ formatTime(timeRemaining) }}
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Warning for Unanswered Questions -->
          <v-alert
            v-if="hasUnansweredQuestions"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-alert</v-icon>
              <div>
                <div class="font-weight-bold">Incomplete Test</div>
                <div class="text-body-2">
                  {{ getWarningMessage() }}
                </div>
              </div>
            </div>
          </v-alert>
          
          <!-- Success Message -->
          <v-alert
            v-else
            type="success"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-check-circle</v-icon>
              <div>
                <div class="font-weight-bold">Test Complete</div>
                <div class="text-body-2">
                  You have answered all questions. Ready to submit!
                </div>
              </div>
            </div>
          </v-alert>
          
          <!-- Confirmation Message -->
          <div class="confirmation-text">
            <p class="text-body-1 mb-2">
              <strong>Are you sure you want to submit your test?</strong>
            </p>
            <p class="text-body-2 text-grey-darken-1">
              Once submitted, you cannot make any changes to your answers. 
              You will be redirected to the results page.
            </p>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-4">
        <v-btn
          variant="outlined"
          @click="isOpen = false"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          Continue Test
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          color="success"
          variant="elevated"
          @click="submitTest"
        >
          <v-icon start>mdi-check</v-icon>
          Submit Test
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.submission-summary {
  max-width: 100%;
}

.stat-item {
  text-align: center;
}

.stat-value {
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.confirmation-text {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #1976d2;
}

@media (max-width: 768px) {
  .stat-item {
    margin-bottom: 16px;
  }
}
</style>