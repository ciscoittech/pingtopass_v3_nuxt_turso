<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import StatusIndicator from '@/components/admin/StatusIndicator.vue'
import QuestionTypeChip from '@/components/admin/QuestionTypeChip.vue'
import QuestionPreview from '@/components/admin/QuestionPreview.vue'
import QuestionImport from '@/components/admin/QuestionImport.vue'
import QuestionGenerator from '@/components/admin/QuestionGenerator.vue'
import type { Question, QuestionFormData, QuestionType } from '@/types/question'
import type { Exam } from '@/types/exam'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Question Management' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/admin'
  },
  {
    text: 'Questions',
    disabled: true,
    to: ''
  }
])

// State
const dialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const deleteDialog = ref(false)
const importDialog = ref(false)
const generateDialog = ref(false)
const selectedExamId = ref('')
const searchQuery = ref('')
const selectedQuestionType = ref('')
const showActiveOnly = ref(true)
const selectedBulkItems = ref<string[]>([])
const showFilters = ref(false)

// Form data
const formData = ref<QuestionFormData>({
  examId: '',
  objectiveId: '',
  questionText: '',
  questionType: 'multiple-choice',
  options: ['', '', '', ''],
  correctAnswer: [],
  explanation: ''
})

// Selected question for deletion
const selectedQuestion = ref<Question | null>(null)

// Fetch data
const { data: examsData } = await useFetch('/api/exams')
const { data: questionsData, refresh: refreshQuestions } = await useFetch(() => {
  const params = new URLSearchParams()
  if (selectedExamId.value) params.append('examId', selectedExamId.value)
  if (searchQuery.value) params.append('search', searchQuery.value)
  if (selectedQuestionType.value) params.append('questionType', selectedQuestionType.value)
  if (showActiveOnly.value) params.append('activeOnly', 'true')
  
  return `/api/questions?${params.toString()}`
})

const exams = computed(() => examsData.value?.data || [])
const questions = computed(() => questionsData.value?.data || [])

// Stats
const questionStats = computed(() => {
  const stats = {
    total: questions.value.length,
    active: questions.value.filter(q => q.isActive).length,
    inactive: questions.value.filter(q => !q.isActive).length,
    byType: {
      'multiple-choice': 0,
      'multiple-select': 0,
      'true-false': 0,
      'fill-blank': 0
    },
    byExam: {} as Record<string, number>
  }
  
  questions.value.forEach(question => {
    // Count by type
    const type = question.questionType || 'multiple-choice'
    if (type in stats.byType) {
      stats.byType[type as keyof typeof stats.byType]++
    }
    
    // Count by exam
    if (question.examId) {
      stats.byExam[question.examId] = (stats.byExam[question.examId] || 0) + 1
    }
  })
  
  return stats
})

// Computed exam name for display
const selectedExamName = computed(() => {
  if (!selectedExamId.value) return 'All Questions'
  const exam = exams.value.find(e => e.id === selectedExamId.value)
  return exam ? `${exam.examCode} - ${exam.examName}` : 'Unknown Exam'
})

// Watch for filter changes
watch([selectedExamId, selectedQuestionType, showActiveOnly], () => {
  refreshQuestions()
})

// Watch for search query changes with debouncing
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    refreshQuestions()
  }, 500)
})

// Table headers
const headers = [
  { title: 'Question', key: 'question', sortable: false },
  { title: 'Type', key: 'questionType', sortable: true },
  { title: 'Exam', key: 'examName', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
]

// Question types
const questionTypes: { title: string; value: QuestionType }[] = [
  { title: 'Multiple Choice', value: 'multiple-choice' },
  { title: 'Multiple Select', value: 'multiple-select' },
  { title: 'True/False', value: 'true-false' },
  { title: 'Fill in the Blank', value: 'fill-blank' }
]

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    examId: selectedExamId.value || '',
    objectiveId: '',
    questionText: '',
    questionType: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: [],
    explanation: ''
  }
  dialog.value = true
}

const openEditDialog = (question: Question) => {
  editMode.value = true
  formData.value = {
    id: question.id,
    examId: question.examId,
    objectiveId: question.objectiveId || '',
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options || ['', '', '', ''],
    correctAnswer: question.correctAnswer || [],
    explanation: question.explanation || ''
  }
  dialog.value = true
}

const openDeleteDialog = (question: Question) => {
  selectedQuestion.value = question
  deleteDialog.value = true
}

const addOption = () => {
  formData.value.options.push('')
}

const removeOption = (index: number) => {
  if (formData.value.options.length > 2) {
    formData.value.options.splice(index, 1)
    // Update correct answers if needed
    formData.value.correctAnswer = formData.value.correctAnswer
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i)
  }
}

const saveQuestion = async () => {
  loading.value = true
  try {
    const payload = {
      examId: formData.value.examId,
      objectiveId: formData.value.objectiveId || null,
      questionText: formData.value.questionText,
      questionType: formData.value.questionType,
      options: formData.value.options.filter(opt => opt.trim() !== ''),
      correctAnswer: formData.value.correctAnswer,
      explanation: formData.value.explanation,
      isActive: true
    }

    if (editMode.value) {
      await $fetch(`/api/questions/${formData.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/questions', {
        method: 'POST',
        body: payload
      })
    }
    
    await refreshQuestions()
    dialog.value = false
    useNuxtApp().$toast.success(editMode.value ? 'Question updated successfully' : 'Question created successfully')
  } catch (error) {
    console.error('Error saving question:', error)
    useNuxtApp().$toast.error('Failed to save question')
  }
  loading.value = false
}

const deleteQuestion = async () => {
  if (!selectedQuestion.value) return
  
  loading.value = true
  try {
    await $fetch(`/api/questions/${selectedQuestion.value.id}`, {
      method: 'DELETE'
    })
    
    await refreshQuestions()
    deleteDialog.value = false
    selectedQuestion.value = null
    useNuxtApp().$toast.success('Question deleted successfully')
  } catch (error) {
    console.error('Error deleting question:', error)
    useNuxtApp().$toast.error('Failed to delete question')
  }
  loading.value = false
}

const bulkActivate = async (questionIds: string[]) => {
  // Implementation for bulk activate
  console.log('Bulk activate:', questionIds)
  useNuxtApp().$toast.info('Bulk activate feature coming soon')
}

const bulkDeactivate = async (questionIds: string[]) => {
  // Implementation for bulk deactivate
  console.log('Bulk deactivate:', questionIds)
  useNuxtApp().$toast.info('Bulk deactivate feature coming soon')
}

const bulkDelete = async (questionIds: string[]) => {
  // Implementation for bulk delete
  console.log('Bulk delete:', questionIds)
  useNuxtApp().$toast.info('Bulk delete feature coming soon')
}

const exportQuestions = () => {
  // Implementation for export
  console.log('Export questions')
  useNuxtApp().$toast.info('Export feature coming soon')
}

const getExamName = (examId: string) => {
  const exam = exams.value.find(e => e.id === examId)
  return exam ? `${exam.examCode}` : 'Unknown'
}

const truncateText = (text: string, length: number = 100) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const onQuestionsImported = (count: number) => {
  refreshQuestions()
  importDialog.value = false
}

const onQuestionsGenerated = (count: number) => {
  refreshQuestions()
  generateDialog.value = false
}

const resetFilters = () => {
  selectedExamId.value = ''
  selectedQuestionType.value = ''
  showActiveOnly.value = true
  searchQuery.value = ''
}

const updateCorrectAnswer = (index: number, checked: boolean) => {
  if (formData.value.questionType === 'multiple-choice') {
    // Single choice - replace array
    formData.value.correctAnswer = checked ? [index] : []
  } else {
    // Multiple choice - add/remove from array
    if (checked) {
      if (!formData.value.correctAnswer.includes(index)) {
        formData.value.correctAnswer.push(index)
      }
    } else {
      const i = formData.value.correctAnswer.indexOf(index)
      if (i > -1) formData.value.correctAnswer.splice(i, 1)
    }
  }
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
              <h3 class="text-h3 font-weight-bold">{{ questionStats.total }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Total Questions</p>
            </div>
            <Icon icon="solar:question-circle-bold-duotone" size="48" class="text-primary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-primary">{{ questionStats.byType['multiple-choice'] }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Multiple Choice</p>
            </div>
            <Icon icon="solar:list-check-bold-duotone" size="48" class="text-primary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-secondary">{{ questionStats.byType['multiple-select'] }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Multiple Select</p>
            </div>
            <Icon icon="solar:checklist-minimalistic-bold-duotone" size="48" class="text-secondary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-success">{{ questionStats.active }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Active Questions</p>
            </div>
            <Icon icon="solar:check-circle-bold-duotone" size="48" class="text-success" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Filters Sidebar -->
      <v-col v-if="showFilters" cols="12" md="3">
        <v-card elevation="10" class="pa-6">
          <h6 class="text-h6 mb-4">Filters</h6>
          
          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            label="Search questions"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
          >
            <template #prepend-inner>
              <Icon icon="solar:magnifer-line-duotone" size="20" />
            </template>
          </v-text-field>
          
          <!-- Exam Filter -->
          <v-select
            v-model="selectedExamId"
            :items="[{ title: 'All Exams', value: '' }, ...exams.map(e => ({ title: `${e.examCode} - ${e.examName}`, value: e.id }))]"
            item-title="title"
            item-value="value"
            label="Filter by Exam"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
          />
          
          <!-- Question Type Filter -->
          <v-select
            v-model="selectedQuestionType"
            :items="[{ title: 'All Types', value: '' }, ...questionTypes]"
            item-title="title"
            item-value="value"
            label="Question Type"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
          />
          
          <!-- Active Only Toggle -->
          <v-switch
            v-model="showActiveOnly"
            label="Active Only"
            color="primary"
            hide-details
            class="mb-6"
          />
          
          <v-btn
            variant="outlined"
            block
            @click="resetFilters"
          >
            Reset Filters
          </v-btn>
        </v-card>
      </v-col>
      
      <!-- Data Table -->
      <v-col :cols="showFilters ? 9 : 12">
        <UiParentCard title="Question Management">
          <AdminDataTable
            :headers="headers"
            :items="questions"
            :loading="loading"
            table-class="questionlist"
            search-label="Search questions..."
            create-button-text="Add New Question"
            :show-select="true"
            :show-bulk-actions="true"
            :show-search="false"
            empty-icon="solar:question-square-broken"
            empty-title="No questions found"
            empty-subtitle="Create your first question or import from a file"
            @create="openCreateDialog"
            @edit="openEditDialog"
            @delete="openDeleteDialog"
            @update:selected="selectedBulkItems = $event"
          >
            <!-- Toolbar Actions -->
            <template #toolbar-actions>
              <v-btn
                variant="outlined"
                size="small"
                @click="showFilters = !showFilters"
                class="mr-2"
              >
                <Icon icon="solar:filter-line-duotone" class="mr-2" size="18" />
                Filters
                <v-badge
                  v-if="searchQuery || selectedExamId || selectedQuestionType || !showActiveOnly"
                  dot
                  color="primary"
                  class="ml-1"
                />
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                @click="generateDialog = true"
                color="secondary"
                class="mr-2"
              >
                <Icon icon="solar:magic-stick-3-line-duotone" class="mr-2" size="18" />
                Generate AI
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                @click="importDialog = true"
                class="mr-2"
              >
                <Icon icon="solar:upload-line-duotone" class="mr-2" size="18" />
                Import
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                @click="exportQuestions"
              >
                <Icon icon="solar:export-line-duotone" class="mr-2" size="18" />
                Export
              </v-btn>
            </template>

            <!-- Bulk Actions -->
            <template #bulk-actions="{ selected }">
              <v-list-item @click="bulkActivate(selected)">
                <template #prepend>
                  <Icon icon="solar:check-circle-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title>Activate</v-list-item-title>
              </v-list-item>
              <v-list-item @click="bulkDeactivate(selected)">
                <template #prepend>
                  <Icon icon="solar:close-circle-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title>Deactivate</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item @click="bulkDelete(selected)" class="text-error">
                <template #prepend>
                  <Icon icon="solar:trash-bin-trash-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </template>

            <!-- Question Column -->
            <template #item.question="{ item }">
              <div class="py-2">
                <div class="text-body-1 mb-1">
                  {{ truncateText(item.questionText, 120) }}
                </div>
                <div class="d-flex align-center gap-2">
                  <v-chip size="x-small" variant="tonal" color="primary">
                    {{ item.options?.length || 0 }} options
                  </v-chip>
                  <span v-if="item.explanation" class="text-caption text-medium-emphasis">
                    <Icon icon="solar:info-circle-line-duotone" size="14" class="mr-1" />
                    Has explanation
                  </span>
                </div>
              </div>
            </template>

            <!-- Type Column -->
            <template #item.questionType="{ item }">
              <QuestionTypeChip :question-type="item.questionType" show-icon />
            </template>

            <!-- Exam Column -->
            <template #item.examName="{ item }">
              <v-chip size="small" variant="tonal">
                {{ getExamName(item.examId) }}
              </v-chip>
            </template>

            <!-- Status Column -->
            <template #item.status="{ item }">
              <StatusIndicator :active="item.isActive" />
            </template>
          </AdminDataTable>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="1200px" scrollable>
      <v-card elevation="10">
        <v-card-title class="text-h5 pa-6 pb-3">
          {{ editMode ? 'Edit Question' : 'Create New Question' }}
        </v-card-title>
        
        <v-card-text class="pa-6 pt-0">
          <v-row>
            <!-- Form Column -->
            <v-col cols="12" md="7">
              <v-container class="pa-0">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="formData.examId"
                      :items="exams"
                      item-title="examName"
                      item-value="id"
                      label="Exam"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Exam is required']"
                      required
                    >
                      <template #prepend-inner>
                        <Icon icon="solar:document-text-line-duotone" size="20" />
                      </template>
                      <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props">
                          <v-list-item-title>{{ item.raw.examCode }} - {{ item.raw.examName }}</v-list-item-title>
                        </v-list-item>
                      </template>
                      <template v-slot:selection="{ item }">
                        {{ item.raw.examCode }} - {{ item.raw.examName }}
                      </template>
                    </v-select>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="formData.questionType"
                      :items="questionTypes"
                      item-title="title"
                      item-value="value"
                      label="Question Type"
                      variant="outlined"
                      density="comfortable"
                      required
                    >
                      <template #prepend-inner>
                        <Icon icon="solar:list-line-duotone" size="20" />
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col cols="12">
                    <v-textarea
                      v-model="formData.questionText"
                      label="Question Text"
                      variant="outlined"
                      density="comfortable"
                      rows="4"
                      :rules="[v => !!v || 'Question text is required']"
                      required
                    >
                      <template #prepend-inner>
                        <Icon icon="solar:question-circle-line-duotone" size="20" />
                      </template>
                    </v-textarea>
                  </v-col>
                </v-row>
                
                <!-- Answer Options -->
                <div class="mb-4">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <h3 class="text-h6">Answer Options</h3>
                    <v-btn
                      variant="outlined"
                      size="small"
                      @click="addOption"
                    >
                      <Icon icon="solar:add-circle-line-duotone" class="mr-2" size="18" />
                      Add Option
                    </v-btn>
                  </div>
                  
                  <v-row v-for="(option, index) in formData.options" :key="index" class="align-center">
                    <v-col cols="10">
                      <v-text-field
                        v-model="formData.options[index]"
                        :label="`Option ${index + 1}`"
                        variant="outlined"
                        density="comfortable"
                      >
                        <template #prepend>
                          <v-checkbox
                            v-if="formData.questionType !== 'true-false'"
                            :model-value="formData.correctAnswer.includes(index)"
                            @update:model-value="updateCorrectAnswer(index, $event)"
                            color="success"
                            hide-details
                          />
                        </template>
                      </v-text-field>
                    </v-col>
                    <v-col cols="2" class="d-flex justify-center">
                      <v-btn
                        v-if="formData.options.length > 2"
                        icon
                        variant="text"
                        color="error"
                        size="small"
                        @click="removeOption(index)"
                      >
                        <Icon icon="solar:trash-bin-trash-line-duotone" />
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
                
                <v-row>
                  <v-col cols="12">
                    <v-textarea
                      v-model="formData.explanation"
                      label="Explanation (Optional)"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                      placeholder="Explain why this is the correct answer..."
                    >
                      <template #prepend-inner>
                        <Icon icon="solar:info-circle-line-duotone" size="20" />
                      </template>
                    </v-textarea>
                  </v-col>
                </v-row>
              </v-container>
            </v-col>
            
            <!-- Preview Column -->
            <v-col cols="12" md="5">
              <QuestionPreview :question="formData" />
            </v-col>
          </v-row>
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
            @click="saveQuestion"
            :loading="loading"
            :disabled="!formData.questionText || !formData.examId || formData.correctAnswer.length === 0"
          >
            {{ editMode ? 'Update Question' : 'Create Question' }}
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
          <h5 class="text-h5 mb-2">Delete Question?</h5>
          <p class="text-body-1 text-medium-emphasis">
            Are you sure you want to delete this question?
          </p>
          <v-alert
            type="info"
            variant="tonal"
            class="mt-4"
          >
            This action cannot be undone. The question will be permanently removed.
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
            @click="deleteQuestion"
            :loading="loading"
          >
            Yes, Delete
          </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Import Questions Dialog -->
    <QuestionImport
      :open="!!importDialog"
      :exam-id="selectedExamId"
      @close="importDialog = false"
      @imported="onQuestionsImported"
    />

    <!-- Generate Questions Dialog -->
    <QuestionGenerator
      :open="!!generateDialog"
      :exam-id="selectedExamId"
      @close="generateDialog = false"
      @generated="onQuestionsGenerated"
    />
  </div>
</template>