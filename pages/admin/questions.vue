<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

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

// Form data
const formData = ref({
  id: '',
  examId: '',
  objectiveId: '',
  questionText: '',
  questionType: 'multiple-choice',
  options: ['', '', '', ''],
  correctAnswer: [],
  explanation: ''
})

// Selected question for deletion
const selectedQuestion = ref(null)

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
watchDebounced(searchQuery, () => {
  refreshQuestions()
}, { debounce: 500 })

// Table headers
const headers = [
  { title: 'Question', key: 'questionText', sortable: false },
  { title: 'Type', key: 'questionType', sortable: true },
  { title: 'Exam', key: 'examName', sortable: true },
  { title: 'Active', key: 'isActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
]

// Question types
const questionTypes = [
  { title: 'Multiple Choice', value: 'multiple-choice' },
  { title: 'Multiple Select', value: 'multiple-select' },
  { title: 'True/False', value: 'true-false' },
  { title: 'Fill in the Blank', value: 'fill-blank' }
]

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    id: '',
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

const openEditDialog = (question: any) => {
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

const openDeleteDialog = (question: any) => {
  selectedQuestion.value = question
  deleteDialog.value = true
}

const addOption = () => {
  formData.value.options.push('')
}

const removeOption = (index: number) => {
  if (formData.value.options.length > 2) {
    formData.value.options.splice(index, 1)
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
  } catch (error) {
    console.error('Error saving question:', error)
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
  } catch (error) {
    console.error('Error deleting question:', error)
  }
  loading.value = false
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
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">
          Question Management
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          Manage exam questions and answers
        </p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          @click="generateDialog = true"
          prepend-icon="mdi-robot"
          color="secondary"
        >
          Generate with AI
        </v-btn>
        <v-btn
          variant="outlined"
          @click="importDialog = true"
          prepend-icon="mdi-upload"
        >
          Import Questions
        </v-btn>
        <v-btn
          color="primary"
          @click="openCreateDialog"
          prepend-icon="mdi-plus"
        >
          Add Question
        </v-btn>
      </div>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <!-- Search Bar -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Search questions..."
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              clearable
              placeholder="Search by question text or explanation"
            />
          </v-col>
          
          <!-- Exam Filter -->
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedExamId"
              :items="[{ title: 'All Exams', value: '' }, ...exams.map(e => ({ title: `${e.examCode} - ${e.examName}`, value: e.id }))]"
              item-title="title"
              item-value="value"
              label="Filter by Exam"
              variant="outlined"
              clearable
            />
          </v-col>
          
          <!-- Question Type Filter -->
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedQuestionType"
              :items="[
                { title: 'All Types', value: '' },
                { title: 'Multiple Choice', value: 'multiple-choice' },
                { title: 'Multiple Select', value: 'multiple-select' },
                { title: 'True/False', value: 'true-false' },
                { title: 'Fill in the Blank', value: 'fill-blank' }
              ]"
              item-title="title"
              item-value="value"
              label="Question Type"
              variant="outlined"
              clearable
            />
          </v-col>
          
          <!-- Active Only Toggle -->
          <v-col cols="12" md="2">
            <v-switch
              v-model="showActiveOnly"
              label="Active Only"
              color="primary"
              hide-details
            />
          </v-col>
        </v-row>
        
        <!-- Results Summary -->
        <v-row class="mt-2">
          <v-col cols="12">
            <div class="text-body-2 text-grey-darken-1">
              <strong>Showing:</strong> {{ questions.length }} questions
              <span v-if="selectedExamName !== 'All Questions'"> from {{ selectedExamName }}</span>
              <span v-if="searchQuery"> matching "{{ searchQuery }}"</span>
              <span v-if="selectedQuestionType"> of type "{{ selectedQuestionType }}"</span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="questions"
        :loading="loading"
        item-key="id"
      >
        <template v-slot:item.questionText="{ item }">
          <div class="py-2">
            {{ truncateText(item.questionText) }}
          </div>
        </template>

        <template v-slot:item.questionType="{ item }">
          <v-chip
            :color="item.questionType === 'multiple-choice' ? 'primary' : 'secondary'"
            size="small"
          >
            {{ item.questionType }}
          </v-chip>
        </template>

        <template v-slot:item.examName="{ item }">
          {{ getExamName(item.examId) }}
        </template>

        <template v-slot:item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
          >
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="1200px" scrollable>
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Question' : 'Create Question' }}
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <!-- Form Column -->
            <v-col cols="12" md="7">
              <v-form @submit.prevent="saveQuestion">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="formData.examId"
                      :items="exams"
                      item-title="examName"
                      item-value="id"
                      label="Exam *"
                      variant="outlined"
                      required
                      class="mb-4"
                    >
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
                      label="Question Type *"
                      variant="outlined"
                      required
                      class="mb-4"
                    />
                  </v-col>
                </v-row>
                
                <v-textarea
                  v-model="formData.questionText"
                  label="Question Text *"
                  variant="outlined"
                  rows="4"
                  required
                  class="mb-4"
                />
                
                <!-- Answer Options -->
                <div class="mb-4">
                  <div class="d-flex justify-space-between align-center mb-3">
                    <h3 class="text-h6">Answer Options</h3>
                    <v-btn
                      variant="outlined"
                      size="small"
                      @click="addOption"
                      prepend-icon="mdi-plus"
                    >
                      Add Option
                    </v-btn>
                  </div>
                  
                  <v-row v-for="(option, index) in formData.options" :key="index">
                    <v-col cols="10">
                      <v-text-field
                        v-model="formData.options[index]"
                        :label="`Option ${index + 1}`"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col cols="2" class="d-flex align-center">
                      <v-checkbox
                        v-if="formData.questionType !== 'true-false'"
                        :model-value="formData.correctAnswer.includes(index)"
                        @update:model-value="(val) => {
                          if (val) {
                            if (formData.questionType === 'multiple-choice') {
                              formData.correctAnswer = [index]
                            } else {
                              formData.correctAnswer.push(index)
                            }
                          } else {
                            const i = formData.correctAnswer.indexOf(index)
                            if (i > -1) formData.correctAnswer.splice(i, 1)
                          }
                        }"
                        label="Correct"
                        density="compact"
                      />
                      <v-btn
                        v-if="formData.options.length > 2"
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="removeOption(index)"
                      />
                    </v-col>
                  </v-row>
                </div>
                
                <v-textarea
                  v-model="formData.explanation"
                  label="Explanation"
                  variant="outlined"
                  rows="3"
                  placeholder="Explain why this is the correct answer..."
                  class="mb-4"
                />
              </v-form>
            </v-col>
            
            <!-- Preview Column -->
            <v-col cols="12" md="5">
              <AdminQuestionPreview :question="formData" />
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveQuestion"
            :loading="loading"
          >
            {{ editMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this question?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteQuestion"
            :loading="loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Import Questions Dialog -->
    <AdminQuestionImport
      :open="importDialog"
      :exam-id="selectedExamId"
      @close="importDialog = false"
      @imported="onQuestionsImported"
    />

    <!-- Generate Questions Dialog -->
    <AdminQuestionGenerator
      :open="generateDialog"
      :exam-id="selectedExamId"
      @close="generateDialog = false"
      @generated="onQuestionsGenerated"
    />
  </div>
</template>