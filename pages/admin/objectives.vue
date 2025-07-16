<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import ObjectiveDragList from '@/components/admin/ObjectiveDragList.vue'
import type { Objective, ObjectiveFormData } from '@/types/objective'
import type { Exam } from '@/types/exam'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Objective Management' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/admin'
  },
  {
    text: 'Objectives',
    disabled: true,
    to: ''
  }
])

// State
const dialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const deleteDialog = ref(false)
const selectedExamId = ref('')
const reordering = ref(false)

// Form data
const formData = ref<ObjectiveFormData>({
  examId: '',
  title: '',
  description: '',
  weight: 10
})

// Selected objective for deletion
const selectedObjective = ref<Objective | null>(null)

// Fetch data
const { data: examsData } = await useFetch('/api/exams')
const { data: objectivesData, refresh: refreshObjectives } = await useFetch(() => {
  const params = new URLSearchParams()
  if (selectedExamId.value) params.append('examId', selectedExamId.value)
  
  return `/api/objectives?${params.toString()}`
})

const exams = computed(() => examsData.value?.data || [])
const objectives = computed(() => objectivesData.value?.data || [])

// Filtered objectives for selected exam
const filteredObjectives = computed(() => {
  if (!selectedExamId.value) return objectives.value
  return objectives.value.filter(obj => obj.examId === selectedExamId.value)
})

// Stats
const objectiveStats = computed(() => {
  const stats = {
    total: objectives.value.length,
    byExam: {} as Record<string, { count: number; weight: number }>
  }
  
  objectives.value.forEach(objective => {
    if (objective.examId) {
      if (!stats.byExam[objective.examId]) {
        stats.byExam[objective.examId] = { count: 0, weight: 0 }
      }
      stats.byExam[objective.examId].count++
      stats.byExam[objective.examId].weight += objective.weight || 0
    }
  })
  
  return stats
})

// Selected exam details
const selectedExam = computed(() => {
  if (!selectedExamId.value) return null
  return exams.value.find(e => e.id === selectedExamId.value)
})

const selectedExamStats = computed(() => {
  if (!selectedExamId.value) return null
  const examStats = objectiveStats.value.byExam[selectedExamId.value]
  return examStats || { count: 0, weight: 0 }
})

// Watch for exam selection changes
watch(selectedExamId, () => {
  refreshObjectives()
})

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    examId: selectedExamId.value || '',
    title: '',
    description: '',
    weight: 10
  }
  dialog.value = true
}

const openEditDialog = (objective: Objective) => {
  editMode.value = true
  formData.value = {
    id: objective.id,
    examId: objective.examId,
    title: objective.title,
    description: objective.description || '',
    weight: objective.weight,
    order: objective.order
  }
  dialog.value = true
}

const openDeleteDialog = (objective: Objective) => {
  selectedObjective.value = objective
  deleteDialog.value = true
}

const saveObjective = async () => {
  loading.value = true
  try {
    const payload = {
      examId: formData.value.examId,
      title: formData.value.title,
      description: formData.value.description || null,
      weight: Number(formData.value.weight),
      order: formData.value.order || filteredObjectives.value.length + 1,
      isActive: true
    }

    if (editMode.value) {
      await $fetch(`/api/objectives/${formData.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/objectives', {
        method: 'POST',
        body: payload
      })
    }
    
    await refreshObjectives()
    dialog.value = false
    useNuxtApp().$toast.success(editMode.value ? 'Objective updated successfully' : 'Objective created successfully')
  } catch (error) {
    console.error('Error saving objective:', error)
    useNuxtApp().$toast.error('Failed to save objective')
  }
  loading.value = false
}

const deleteObjective = async () => {
  if (!selectedObjective.value) return
  
  loading.value = true
  try {
    await $fetch(`/api/objectives/${selectedObjective.value.id}`, {
      method: 'DELETE'
    })
    
    await refreshObjectives()
    deleteDialog.value = false
    selectedObjective.value = null
    useNuxtApp().$toast.success('Objective deleted successfully')
  } catch (error) {
    console.error('Error deleting objective:', error)
    useNuxtApp().$toast.error('Failed to delete objective')
  }
  loading.value = false
}

const handleReorder = async (reorderedObjectives: Objective[]) => {
  reordering.value = true
  try {
    // Update order for each objective
    const updates = reorderedObjectives.map(obj => ({
      id: obj.id,
      order: obj.order
    }))
    
    await $fetch('/api/objectives/reorder', {
      method: 'POST',
      body: { updates }
    })
    
    await refreshObjectives()
    useNuxtApp().$toast.success('Objectives reordered successfully')
  } catch (error) {
    console.error('Error reordering objectives:', error)
    useNuxtApp().$toast.error('Failed to reorder objectives')
  }
  reordering.value = false
}

const exportObjectives = () => {
  // Implementation for export
  console.log('Export objectives')
  useNuxtApp().$toast.info('Export feature coming soon')
}

const getExamDisplay = (exam: Exam) => {
  return `${exam.examCode} - ${exam.examName}`
}
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    
    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold">{{ objectiveStats.total }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Total Objectives</p>
            </div>
            <Icon icon="solar:target-bold-duotone" size="48" class="text-primary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold">{{ Object.keys(objectiveStats.byExam).length }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Exams with Objectives</p>
            </div>
            <Icon icon="solar:document-text-bold-duotone" size="48" class="text-secondary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold">{{ selectedExamStats?.count || 0 }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Current Exam</p>
            </div>
            <Icon icon="solar:checklist-minimalistic-bold-duotone" size="48" class="text-info" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold" :class="selectedExamStats?.weight === 100 ? 'text-success' : 'text-warning'">
                {{ selectedExamStats?.weight || 0 }}%
              </h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Total Weight</p>
            </div>
            <Icon icon="solar:chart-2-bold-duotone" size="48" :class="selectedExamStats?.weight === 100 ? 'text-success' : 'text-warning'" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <v-col cols="12">
        <UiParentCard>
          <!-- Header with Exam Selector -->
          <template #title>
            <div class="d-flex align-center justify-space-between flex-wrap gap-3">
              <h2 class="text-h5">Exam Objectives</h2>
              <div class="d-flex align-center gap-3">
                <v-select
                  v-model="selectedExamId"
                  :items="exams"
                  :item-title="getExamDisplay"
                  item-value="id"
                  label="Select Exam"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="exam-selector"
                  style="min-width: 300px"
                >
                  <template #prepend-inner>
                    <Icon icon="solar:document-text-line-duotone" size="20" />
                  </template>
                </v-select>
                
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="exportObjectives"
                  :disabled="!selectedExamId"
                >
                  <Icon icon="solar:export-line-duotone" class="mr-2" size="18" />
                  Export
                </v-btn>
                
                <v-btn
                  color="primary"
                  size="small"
                  @click="openCreateDialog"
                  :disabled="!selectedExamId"
                >
                  <Icon icon="solar:add-circle-line-duotone" class="mr-2" size="18" />
                  Add Objective
                </v-btn>
              </div>
            </div>
          </template>

          <!-- No Exam Selected -->
          <div v-if="!selectedExamId" class="text-center py-12">
            <Icon icon="solar:document-broken" size="64" class="mb-4 text-medium-emphasis" />
            <h3 class="text-h6 mb-2">Select an Exam</h3>
            <p class="text-body-2 text-medium-emphasis">
              Choose an exam from the dropdown above to manage its objectives
            </p>
          </div>

          <!-- Objectives List -->
          <div v-else>
            <v-alert
              v-if="selectedExam"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <template #prepend>
                <Icon icon="solar:info-circle-line-duotone" />
              </template>
              <div>
                <strong>{{ selectedExam.examCode }}</strong> - {{ selectedExam.examName }}
                <span v-if="selectedExam.vendorName" class="text-medium-emphasis">
                  ({{ selectedExam.vendorName }})
                </span>
              </div>
              <div class="text-caption mt-1">
                Drag and drop objectives to reorder them. Weights should total 100%.
              </div>
            </v-alert>

            <ObjectiveDragList
              :objectives="filteredObjectives"
              :readonly="reordering"
              @edit="openEditDialog"
              @delete="openDeleteDialog"
            />
          </div>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card elevation="10">
        <v-card-title class="text-h5 pa-6 pb-3">
          {{ editMode ? 'Edit Objective' : 'Create New Objective' }}
        </v-card-title>
        
        <v-card-text class="pa-6 pt-0">
          <v-container class="pa-0">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="formData.examId"
                  :items="exams"
                  :item-title="getExamDisplay"
                  item-value="id"
                  label="Exam"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Exam is required']"
                  :disabled="editMode"
                  required
                >
                  <template #prepend-inner>
                    <Icon icon="solar:document-text-line-duotone" size="20" />
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formData.title"
                  label="Objective Title"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Title is required']"
                  required
                  placeholder="e.g., Configure network security"
                >
                  <template #prepend-inner>
                    <Icon icon="solar:target-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description (Optional)"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  placeholder="Detailed description of what this objective covers..."
                >
                  <template #prepend-inner>
                    <Icon icon="solar:text-align-left-line-duotone" size="20" />
                  </template>
                </v-textarea>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model.number="formData.weight"
                  label="Weight (%)"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="1"
                  max="100"
                  :rules="[
                    v => !!v || 'Weight is required',
                    v => v >= 1 || 'Weight must be at least 1%',
                    v => v <= 100 || 'Weight cannot exceed 100%'
                  ]"
                  suffix="%"
                  hint="Percentage of exam questions from this objective"
                  persistent-hint
                >
                  <template #prepend-inner>
                    <Icon icon="solar:chart-2-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="flat"
            color="error"
            rounded="pill"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            @click="saveObjective"
            :loading="loading"
            :disabled="!formData.title || !formData.examId || !formData.weight"
          >
            {{ editMode ? 'Update Objective' : 'Create Objective' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card elevation="10">
        <v-card-text class="text-center pa-6">
          <Icon 
            icon="solar:trash-bin-minimalistic-2-broken" 
            size="64" 
            class="mb-4 text-error" 
          />
          <h5 class="text-h5 mb-2">Delete Objective?</h5>
          <p class="text-body-1 text-medium-emphasis">
            Are you sure you want to delete <strong>{{ selectedObjective?.title }}</strong>?
          </p>
          <v-alert
            v-if="selectedObjective?.questionCount && selectedObjective.questionCount > 0"
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            <Icon icon="solar:danger-triangle-line-duotone" size="20" class="mr-2" />
            This objective has {{ selectedObjective.questionCount }} associated questions that may be affected.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="flat"
            color="error"
            rounded="pill"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            @click="deleteObjective"
            :loading="loading"
          >
            Yes, Delete
          </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.exam-selector :deep(.v-field__input) {
  font-weight: 500;
}
</style>