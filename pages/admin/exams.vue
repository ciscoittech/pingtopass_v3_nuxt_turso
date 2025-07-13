<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

// State
const dialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const deleteDialog = ref(false)

// Form data
const formData = ref({
  id: '',
  vendorId: '',
  code: '',
  name: '',
  description: '',
  passingScore: 700,
  questionCount: 0,
  duration: 90,
  price: 0,
  isActive: true
})

// Selected exam for deletion
const selectedExam = ref(null)

// Fetch data
const { data: examsData, refresh: refreshExams } = await useFetch('/api/exams')
const { data: vendorsData } = await useFetch('/api/vendors')

const exams = computed(() => examsData.value?.data || [])
const vendors = computed(() => vendorsData.value?.data || [])

// Table headers
const headers = [
  { title: 'Code', key: 'examCode', sortable: true },
  { title: 'Name', key: 'examName', sortable: true },
  { title: 'Vendor', key: 'vendorName', sortable: true },
  { title: 'Questions', key: 'numberOfQuestions', sortable: true },
  { title: 'Duration', key: 'examDuration', sortable: true },
  { title: 'Passing Score', key: 'passingScore', sortable: true },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
]

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    id: '',
    vendorId: '',
    code: '',
    name: '',
    description: '',
    passingScore: 700,
    questionCount: 0,
    duration: 90,
    price: 0,
    isActive: true
  }
  dialog.value = true
}

const openEditDialog = (exam: any) => {
  editMode.value = true
  formData.value = {
    id: exam.id,
    vendorId: exam.vendorId,
    code: exam.examCode,
    name: exam.examName,
    description: exam.description || '',
    passingScore: exam.passingScore || 700,
    questionCount: exam.numberOfQuestions || 0,
    duration: exam.examDuration || 90,
    price: exam.price || 0,
    isActive: exam.isActive !== false
  }
  dialog.value = true
}

const openDeleteDialog = (exam: any) => {
  selectedExam.value = exam
  deleteDialog.value = true
}

const saveExam = async () => {
  loading.value = true
  try {
    const payload = {
      vendorId: formData.value.vendorId,
      code: formData.value.code,
      name: formData.value.name,
      description: formData.value.description,
      passingScore: Number(formData.value.passingScore),
      questionCount: Number(formData.value.questionCount),
      duration: Number(formData.value.duration),
      price: Number(formData.value.price),
      isActive: formData.value.isActive
    }

    if (editMode.value) {
      await $fetch(`/api/exams/${formData.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/exams', {
        method: 'POST',
        body: payload
      })
    }
    
    await refreshExams()
    dialog.value = false
  } catch (error) {
    console.error('Error saving exam:', error)
  }
  loading.value = false
}

const deleteExam = async () => {
  if (!selectedExam.value) return
  
  loading.value = true
  try {
    await $fetch(`/api/exams/${selectedExam.value.id}`, {
      method: 'DELETE'
    })
    
    await refreshExams()
    deleteDialog.value = false
    selectedExam.value = null
  } catch (error) {
    console.error('Error deleting exam:', error)
  }
  loading.value = false
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString()
}

const getVendorName = (vendorId: string) => {
  const vendor = vendors.value.find(v => v.id === vendorId)
  return vendor?.name || 'Unknown'
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">
          Exam Management
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          Manage certification exams and assessments
        </p>
      </div>
      
      <v-btn
        color="primary"
        @click="openCreateDialog"
        prepend-icon="mdi-plus"
      >
        Add Exam
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="exams"
        :loading="loading"
        item-key="id"
      >
        <template v-slot:item.examDuration="{ item }">
          {{ item.examDuration }} min
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
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Exam' : 'Create Exam' }}
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="saveExam">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.vendorId"
                  :items="vendors"
                  item-title="name"
                  item-value="id"
                  label="Vendor *"
                  variant="outlined"
                  required
                  class="mb-4"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.code"
                  label="Exam Code *"
                  variant="outlined"
                  placeholder="e.g., 220-1101"
                  required
                  class="mb-4"
                />
              </v-col>
            </v-row>
            
            <v-text-field
              v-model="formData.name"
              label="Exam Name *"
              variant="outlined"
              placeholder="e.g., CompTIA A+ Core 1"
              required
              class="mb-4"
            />
            
            <v-textarea
              v-model="formData.description"
              label="Description"
              variant="outlined"
              rows="3"
              placeholder="Brief description of the exam..."
              class="mb-4"
            />
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.passingScore"
                  label="Passing Score"
                  variant="outlined"
                  type="number"
                  min="0"
                  max="1000"
                  class="mb-4"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.questionCount"
                  label="Number of Questions"
                  variant="outlined"
                  type="number"
                  min="0"
                  class="mb-4"
                />
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.duration"
                  label="Duration (minutes)"
                  variant="outlined"
                  type="number"
                  min="0"
                  class="mb-4"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.price"
                  label="Price (cents)"
                  variant="outlined"
                  type="number"
                  min="0"
                  placeholder="e.g., 29999 for $299.99"
                  class="mb-4"
                />
              </v-col>
            </v-row>
            
            <v-switch
              v-model="formData.isActive"
              label="Active"
              color="primary"
              class="mb-4"
            />
          </v-form>
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
            @click="saveExam"
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
          Are you sure you want to delete "{{ selectedExam?.examName }}"?
          This action cannot be undone and will also delete all associated questions.
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
            @click="deleteExam"
            :loading="loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>