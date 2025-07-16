<template>
  <v-card elevation="0" rounded="lg">
    <v-card-text class="pa-6">
      <div class="d-flex align-center mb-4">
        <v-icon color="primary" size="28" class="mr-3">mdi-target</v-icon>
        <h3 class="text-h5 font-weight-bold">Exam Objectives</h3>
      </div>

      <!-- Objectives List -->
      <v-expansion-panels
        v-if="objectives && objectives.length > 0"
        variant="accordion"
        class="objectives-panels"
      >
        <v-expansion-panel
          v-for="(objective, index) in objectives"
          :key="objective.id || index"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-avatar
                :color="getObjectiveColor(objective.mastery)"
                variant="tonal"
                size="36"
                class="mr-3"
              >
                {{ index + 1 }}
              </v-avatar>
              <div class="flex-grow-1">
                <div class="font-weight-semibold">{{ objective.title }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ objective.weight }}% of exam
                </div>
              </div>
              <v-progress-linear
                :model-value="objective.mastery || 0"
                :color="getObjectiveColor(objective.mastery)"
                height="6"
                rounded
                class="ml-4"
                style="max-width: 100px"
              />
            </div>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <div class="pt-2">
              <p class="text-body-2 mb-4">{{ objective.description }}</p>
              
              <!-- Sub-topics -->
              <div v-if="objective.topics && objective.topics.length > 0">
                <h6 class="text-subtitle-2 font-weight-semibold mb-3">Key Topics:</h6>
                <v-list density="compact" class="pa-0">
                  <v-list-item
                    v-for="topic in objective.topics"
                    :key="topic"
                    class="px-0"
                  >
                    <template v-slot:prepend>
                      <v-icon size="small" color="primary">mdi-chevron-right</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ topic }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Progress Stats -->
              <v-divider class="my-4" />
              <v-row dense>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-primary">
                      {{ objective.questionsAttempted || 0 }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Questions Attempted
                    </div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-success">
                      {{ Math.round(objective.accuracy || 0) }}%
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Accuracy
                    </div>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Empty State -->
      <v-alert
        v-else
        type="info"
        variant="tonal"
        class="mt-2"
      >
        <v-icon slot="prepend">mdi-information-outline</v-icon>
        <div>
          <div class="font-weight-semibold mb-1">Objectives Coming Soon</div>
          <div class="text-body-2">
            Detailed exam objectives with mastery tracking will be available shortly.
            Start practicing to build your knowledge across all exam domains.
          </div>
        </div>
      </v-alert>

      <!-- Overall Progress -->
      <v-card
        v-if="objectives && objectives.length > 0"
        variant="tonal"
        class="mt-6"
        color="primary"
      >
        <v-card-text class="d-flex align-center justify-space-between">
          <div>
            <div class="text-subtitle-2 font-weight-semibold">Overall Domain Coverage</div>
            <div class="text-caption">
              {{ masteredObjectives }} of {{ objectives.length }} domains mastered
            </div>
          </div>
          <v-progress-circular
            :model-value="overallProgress"
            :size="60"
            :width="6"
            color="white"
          >
            <span class="text-body-2 font-weight-bold">{{ Math.round(overallProgress) }}%</span>
          </v-progress-circular>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Objective {
  id?: string
  title: string
  description: string
  weight: number
  topics?: string[]
  mastery?: number
  questionsAttempted?: number
  accuracy?: number
}

interface Props {
  objectives?: Objective[]
}

const props = defineProps<Props>()

// Computed properties
const getObjectiveColor = (mastery: number = 0) => {
  if (mastery >= 80) return 'success'
  if (mastery >= 60) return 'info'
  if (mastery >= 40) return 'warning'
  return 'default'
}

const masteredObjectives = computed(() => {
  if (!props.objectives) return 0
  return props.objectives.filter(obj => (obj.mastery || 0) >= 80).length
})

const overallProgress = computed(() => {
  if (!props.objectives || props.objectives.length === 0) return 0
  const totalMastery = props.objectives.reduce((sum, obj) => sum + (obj.mastery || 0), 0)
  return totalMastery / props.objectives.length
})
</script>

<style lang="scss" scoped>
.objectives-panels {
  :deep(.v-expansion-panel) {
    margin-bottom: 12px;
    border-radius: 12px !important;
    overflow: hidden;
    
    &::after {
      border: none;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(.v-expansion-panel-title) {
    padding: 16px;
    
    &:hover {
      background: rgba(var(--v-theme-on-surface), 0.04);
    }
  }
  
  :deep(.v-expansion-panel-text__wrapper) {
    padding: 0 16px 16px;
  }
}

.v-list-item {
  min-height: 32px;
}
</style>