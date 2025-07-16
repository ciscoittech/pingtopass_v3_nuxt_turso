<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  open: boolean
  examId?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'imported', count: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const step = ref(1) // 1: Upload, 2: Preview, 3: Import
const loading = ref(false)
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const importData = ref<any[]>([])
const validationErrors = ref<string[]>([])
const importResults = ref<{ success: number; errors: string[] }>({ success: 0, errors: [] })

// CSV/JSON sample templates
const csvTemplate = `questionText,questionType,options,correctAnswer,explanation
"What is the capital of France?","multiple-choice","Paris|London|Berlin|Madrid","0","Paris is the capital city of France."
"TCP uses which port number for HTTP?","multiple-choice","80|443|21|22","0","HTTP typically uses port 80 for standard web traffic."
"Which protocol is used for secure web browsing?","multiple-choice","HTTP|HTTPS|FTP|SMTP","1","HTTPS (HTTP Secure) is used for secure web browsing."
`

const jsonTemplate = `[
  {
    "questionText": "What is the capital of France?",
    "questionType": "multiple-choice",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "correctAnswer": [0],
    "explanation": "Paris is the capital city of France."
  },
  {
    "questionText": "TCP uses which port number for HTTP?",
    "questionType": "multiple-choice", 
    "options": ["80", "443", "21", "22"],
    "correctAnswer": [0],
    "explanation": "HTTP typically uses port 80 for standard web traffic."
  }
]`

// Methods
const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    file.value = target.files[0]
    parseFile()
  }
}

const parseFile = async () => {
  if (!file.value) return
  
  loading.value = true
  validationErrors.value = []
  
  try {
    const text = await file.value.text()
    
    if (file.value.name.endsWith('.json')) {
      importData.value = JSON.parse(text)
    } else if (file.value.name.endsWith('.csv')) {
      importData.value = parseCSV(text)
    } else {
      validationErrors.value.push('Unsupported file format. Please use CSV or JSON.')
      return
    }
    
    validateData()
    if (validationErrors.value.length === 0) {
      step.value = 2
    }
  } catch (error) {
    validationErrors.value.push(`File parsing error: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const parseCSV = (text: string) => {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: any = {}
    
    headers.forEach((header, index) => {
      let value = values[index] || ''
      
      // Handle special fields
      if (header === 'options') {
        value = value.split('|').map(opt => opt.trim())
      } else if (header === 'correctAnswer') {
        value = value.split(',').map(idx => parseInt(idx.trim()))
      }
      
      row[header] = value
    })
    
    data.push(row)
  }
  
  return data
}

const parseCSVLine = (line: string) => {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

const validateData = () => {
  validationErrors.value = []
  
  if (!importData.value || importData.value.length === 0) {
    validationErrors.value.push('No data found in file')
    return
  }
  
  importData.value.forEach((row, index) => {
    const lineNum = index + 1
    
    if (!row.questionText || typeof row.questionText !== 'string') {
      validationErrors.value.push(`Line ${lineNum}: Question text is required`)
    }
    
    if (!row.questionType || !['multiple-choice', 'multiple-select', 'true-false', 'fill-blank'].includes(row.questionType)) {
      validationErrors.value.push(`Line ${lineNum}: Invalid question type`)
    }
    
    if (!Array.isArray(row.options) || row.options.length < 2) {
      validationErrors.value.push(`Line ${lineNum}: At least 2 options are required`)
    }
    
    if (!Array.isArray(row.correctAnswer) || row.correctAnswer.length === 0) {
      validationErrors.value.push(`Line ${lineNum}: Correct answer is required`)
    }
  })
}

const importQuestions = async () => {
  loading.value = true
  importResults.value = { success: 0, errors: [] }
  
  try {
    const response = await $fetch('/api/questions/import', {
      method: 'POST',
      body: {
        examId: props.examId,
        questions: importData.value
      }
    })
    
    importResults.value = response.data
    step.value = 3
    
    if (response.data.success > 0) {
      emit('imported', response.data.success)
    }
  } catch (error) {
    validationErrors.value.push(`Import failed: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const downloadTemplate = (format: 'csv' | 'json') => {
  const content = format === 'csv' ? csvTemplate : jsonTemplate
  const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `question-template.${format}`
  a.click()
  URL.revokeObjectURL(url)
}

const resetDialog = () => {
  step.value = 1
  file.value = null
  importData.value = []
  validationErrors.value = []
  importResults.value = { success: 0, errors: [] }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const close = () => {
  resetDialog()
  emit('close')
}

// Watch for dialog close
watch(() => props.open, (newVal) => {
  if (!newVal) {
    resetDialog()
  }
})
</script>

<template>
  <v-dialog :model-value="open" @update:model-value="close" max-width="800px" persistent>
    <v-card elevation="10">
      <v-card-title class="d-flex align-center">
        <Icon icon="solar:upload-bold-duotone" class="mr-2" />
        Import Questions
        <v-spacer />
        <v-btn icon variant="text" @click="close">
          <Icon icon="solar:close-circle-line-duotone" />
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Step 1: File Upload -->
        <div v-if="step === 1">
          <v-alert type="info" variant="tonal" class="mb-4">
            <template #prepend>
              <Icon icon="solar:info-circle-line-duotone" />
            </template>
            Upload a CSV or JSON file containing questions. Download a template to get started.
          </v-alert>

          <!-- Template Downloads -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3">Download Templates</h3>
            <v-row>
              <v-col cols="6">
                <v-btn
                  variant="outlined"
                  block
                  @click="downloadTemplate('csv')"
                >
                  <Icon icon="solar:file-text-line-duotone" class="mr-2" size="18" />
                  CSV Template
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  variant="outlined"
                  block
                  @click="downloadTemplate('json')"
                >
                  <Icon icon="solar:code-square-line-duotone" class="mr-2" size="18" />
                  JSON Template
                </v-btn>
              </v-col>
            </v-row>
          </div>

          <!-- File Upload -->
          <div class="mb-4">
            <h3 class="text-h6 mb-3">Upload File</h3>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.json"
              @change="handleFileSelect"
              style="display: none"
            />
            
            <v-card
              variant="outlined"
              class="pa-8 text-center"
              :class="{ 'border-primary': file }"
              @click="openFileDialog"
              style="cursor: pointer; border-style: dashed;"
            >
              <Icon icon="solar:cloud-upload-bold-duotone" size="48" class="mb-4 text-primary" />
              <h4 class="text-h6 mb-2">
                {{ file ? file.name : 'Click to select file' }}
              </h4>
              <p class="text-body-2 text-grey-darken-1">
                Supports CSV and JSON formats
              </p>
            </v-card>
          </div>

          <!-- Validation Errors -->
          <v-alert
            v-if="validationErrors.length > 0"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <div class="font-weight-bold mb-2">Validation Errors:</div>
            <ul>
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </v-alert>
        </div>

        <!-- Step 2: Preview -->
        <div v-else-if="step === 2">
          <v-alert type="success" variant="tonal" class="mb-4">
            <template #prepend>
              <Icon icon="solar:check-circle-line-duotone" />
            </template>
            Found {{ importData.length }} questions ready to import.
          </v-alert>

          <div class="mb-4">
            <h3 class="text-h6 mb-3">Preview (First 3 Questions)</h3>
            
            <v-expansion-panels>
              <v-expansion-panel
                v-for="(question, index) in importData.slice(0, 3)"
                :key="index"
                :title="`Question ${index + 1}: ${question.questionText?.substring(0, 60)}...`"
              >
                <v-expansion-panel-text>
                  <div class="pa-2">
                    <p><strong>Type:</strong> {{ question.questionType }}</p>
                    <p><strong>Options:</strong></p>
                    <ul>
                      <li
                        v-for="(option, optIndex) in question.options"
                        :key="optIndex"
                        :class="{ 'font-weight-bold text-success': question.correctAnswer.includes(optIndex) }"
                      >
                        {{ option }}
                        <Icon v-if="question.correctAnswer.includes(optIndex)" icon="solar:check-circle-bold" color="success" size="16" />
                      </li>
                    </ul>
                    <p v-if="question.explanation"><strong>Explanation:</strong> {{ question.explanation }}</p>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </div>

        <!-- Step 3: Results -->
        <div v-else-if="step === 3">
          <v-alert
            :type="importResults.success > 0 ? 'success' : 'error'"
            variant="tonal"
            class="mb-4"
          >
            Import completed: {{ importResults.success }} questions imported successfully.
          </v-alert>

          <div v-if="importResults.errors.length > 0" class="mb-4">
            <h3 class="text-h6 mb-3">Import Errors</h3>
            <v-alert type="warning" variant="tonal">
              <ul>
                <li v-for="error in importResults.errors" :key="error">{{ error }}</li>
              </ul>
            </v-alert>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        
        <v-btn
          v-if="step === 1"
          variant="text"
          @click="close"
        >
          Cancel
        </v-btn>
        
        <v-btn
          v-if="step === 2"
          variant="text"
          @click="step = 1"
        >
          Back
        </v-btn>
        
        <v-btn
          v-if="step === 2"
          color="primary"
          @click="importQuestions"
          :loading="loading"
        >
          Import {{ importData.length }} Questions
        </v-btn>
        
        <v-btn
          v-if="step === 3"
          color="primary"
          @click="close"
        >
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>