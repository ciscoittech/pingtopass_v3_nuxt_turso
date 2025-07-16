<template>
  <div class="objective-drag-list">
    <v-alert
      v-if="objectives.length === 0"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <template #prepend>
        <Icon icon="solar:info-circle-line-duotone" />
      </template>
      No objectives found for this exam. Create your first objective to get started.
    </v-alert>

    <div v-else>
      <!-- Objectives List -->
      <div
        v-for="(objective, index) in localObjectives"
        :key="objective.id"
        class="mb-3"
      >
        <v-card 
          elevation="10" 
          class="objective-card"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start gap-3">
              <!-- Drag Handle (disabled for now) -->
              <v-btn
                icon
                variant="text"
                size="small"
                class="drag-handle mt-1"
                disabled
              >
                <Icon icon="solar:hamburger-menu-line-duotone" size="20" />
              </v-btn>

              <!-- Order Number -->
              <v-avatar
                size="32"
                color="primary"
                class="mt-1"
              >
                <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
              </v-avatar>

              <!-- Content -->
              <div class="flex-grow-1">
                <div class="d-flex align-center justify-space-between mb-1">
                  <h3 class="text-h6 font-weight-medium">{{ objective.title }}</h3>
                  <div class="d-flex align-center gap-2">
                    <v-chip
                      size="small"
                      :color="getWeightColor(objective.weight)"
                      variant="tonal"
                    >
                      <Icon icon="solar:chart-2-line-duotone" size="14" class="mr-1" />
                      {{ objective.weight }}%
                    </v-chip>
                    <v-chip
                      v-if="objective.questionCount"
                      size="small"
                      variant="tonal"
                    >
                      {{ objective.questionCount }} questions
                    </v-chip>
                  </div>
                </div>
                
                <p v-if="objective.description" class="text-body-2 text-medium-emphasis mb-2">
                  {{ objective.description }}
                </p>

                <!-- Actions -->
                <div v-if="!readonly" class="d-flex gap-2">
                  <v-btn
                    size="small"
                    variant="text"
                    @click="$emit('edit', objective)"
                  >
                    <Icon icon="solar:pen-line-duotone" size="16" class="mr-1" />
                    Edit
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="text"
                    color="error"
                    @click="$emit('delete', objective)"
                  >
                    <Icon icon="solar:trash-bin-trash-line-duotone" size="16" class="mr-1" />
                    Delete
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Total Weight Summary -->
    <v-card v-if="objectives.length > 0" elevation="10" class="mt-4">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <Icon icon="solar:chart-bold-duotone" size="24" class="text-primary" />
            <span class="text-h6">Total Weight:</span>
          </div>
          <div class="text-h5 font-weight-bold" :class="totalWeightClass">
            {{ totalWeight }}%
          </div>
        </div>
        <v-progress-linear
          :model-value="totalWeight"
          :color="totalWeightColor"
          height="8"
          rounded
          class="mt-2"
        />
        <p class="text-caption text-medium-emphasis mt-2">
          <template v-if="totalWeight === 100">
            ✓ Perfect! Objectives total exactly 100%
          </template>
          <template v-else-if="totalWeight < 100">
            ⚠️ Objectives total {{ totalWeight }}% - add {{ 100 - totalWeight }}% more
          </template>
          <template v-else>
            ⚠️ Objectives total {{ totalWeight }}% - reduce by {{ totalWeight - 100 }}%
          </template>
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Objective } from '@/types/objective'

interface Props {
  objectives: Objective[]
  readonly?: boolean
}

interface Emits {
  (e: 'reorder', objectives: Objective[]): void
  (e: 'edit', objective: Objective): void
  (e: 'delete', objective: Objective): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

const localObjectives = ref<Objective[]>([])

// Watch for changes to objectives prop
watch(() => props.objectives, (newObjectives) => {
  localObjectives.value = [...newObjectives]
}, { immediate: true })

// Calculate total weight
const totalWeight = computed(() => {
  return localObjectives.value.reduce((sum, obj) => sum + (obj.weight || 0), 0)
})

const totalWeightColor = computed(() => {
  if (totalWeight.value === 100) return 'success'
  if (totalWeight.value > 100) return 'error'
  return 'warning'
})

const totalWeightClass = computed(() => {
  if (totalWeight.value === 100) return 'text-success'
  if (totalWeight.value > 100) return 'text-error'
  return 'text-warning'
})

const getWeightColor = (weight: number) => {
  if (weight >= 30) return 'error'
  if (weight >= 20) return 'warning'
  if (weight >= 10) return 'primary'
  return 'secondary'
}
</script>

<style scoped>
.objective-drag-list {
  min-height: 200px;
}

.objective-card {
  transition: all 0.3s ease;
}

.objective-card:hover {
  transform: translateY(-2px);
}

.drag-handle {
  cursor: not-allowed !important;
  opacity: 0.5;
}
</style>