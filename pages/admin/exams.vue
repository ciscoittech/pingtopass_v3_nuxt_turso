<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import StatusIndicator from '@/components/admin/StatusIndicator.vue'
import DifficultyChip from '@/components/admin/DifficultyChip.vue'
import type { Exam, ExamFormData } from '@/types/exam'
import type { Vendor } from '@/types/vendor'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Exam Management' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/admin'
  },
  {
    text: 'Exams',
    disabled: true,
    to: ''
  }
])

// State
const dialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const deleteDialog = ref(false)
const selectedBulkItems = ref<string[]>([])
const showFilters = ref(false)

// Form data
const formData = ref<ExamFormData>({
  vendorId: '',
  code: '',
  name: '',
  description: '',
  passingScore: 700,
  questionCount: 0,
  duration: 90,
  price: 0,
  difficulty: 'intermediate',
  isActive: true,
  tags: []
})

// Selected exam for deletion
const selectedExam = ref<Exam | null>(null)

// Filters
const filters = ref({
  vendors: [] as string[],
  difficulty: [] as string[],
  status: 'all' as 'all' | 'active' | 'inactive',
  priceRange: [0, 500] as [number, number]
})

// Fetch data
const { data: examsData, refresh: refreshExams } = await useFetch('/api/exams')
const { data: vendorsData } = await useFetch('/api/vendors')

const exams = computed(() => {
  const data = examsData.value?.data
  if (Array.isArray(data)) {
    return data
  } else if (data && Array.isArray(data.exams)) {
    return data.exams
  }
  return []
})
const vendors = computed(() => {
  const data = vendorsData.value?.data
  if (Array.isArray(data)) {
    return data
  } else if (data && Array.isArray(data.vendors)) {
    return data.vendors
  }
  return []
})

// Filtered exams
const filteredExams = computed(() => {
  if (!Array.isArray(exams.value)) {
    return []
  }
  let result = [...exams.value]
  
  // Filter by vendors
  if (filters.value.vendors.length > 0) {
    result = result.filter(exam => filters.value.vendors.includes(exam.vendorId))
  }
  
  // Filter by difficulty
  if (filters.value.difficulty.length > 0) {
    result = result.filter(exam => filters.value.difficulty.includes(exam.difficulty || 'intermediate'))
  }
  
  // Filter by status
  if (filters.value.status !== 'all') {
    result = result.filter(exam => filters.value.status === 'active' ? exam.isActive : !exam.isActive)
  }
  
  // Filter by price range
  result = result.filter(exam => {
    const price = exam.price || 0
    return price >= filters.value.priceRange[0] && price <= filters.value.priceRange[1]
  })
  
  return result
})

// Stats
const examStats = computed(() => {
  const stats = {
    total: 0,
    active: 0,
    inactive: 0,
    byDifficulty: {
      easy: 0,
      intermediate: 0,
      hard: 0
    },
    byVendor: {} as Record<string, number>
  }
  
  if (!Array.isArray(exams.value)) {
    return stats
  }
  
  stats.total = exams.value.length
  stats.active = exams.value.filter(e => e.isActive !== false).length
  stats.inactive = exams.value.filter(e => e.isActive === false).length
  
  exams.value.forEach(exam => {
    // Count by difficulty
    const difficulty = exam.difficulty || 'intermediate'
    if (difficulty in stats.byDifficulty) {
      stats.byDifficulty[difficulty as keyof typeof stats.byDifficulty]++
    }
    
    // Count by vendor
    if (exam.vendorId) {
      stats.byVendor[exam.vendorId] = (stats.byVendor[exam.vendorId] || 0) + 1
    }
  })
  
  return stats
})

// Table headers
const headers = [
  { title: 'Exam', key: 'exam', sortable: true },
  { title: 'Questions', key: 'questionCount', sortable: true },
  { title: 'Difficulty', key: 'difficulty', sortable: true },
  { title: 'Duration', key: 'duration', sortable: true },
  { title: 'Price', key: 'price', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '150px' }
]

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    vendorId: '',
    code: '',
    name: '',
    description: '',
    passingScore: 700,
    questionCount: 0,
    duration: 90,
    price: 0,
    difficulty: 'intermediate',
    isActive: true,
    tags: []
  }
  dialog.value = true
}

const openEditDialog = (exam: Exam) => {
  editMode.value = true
  formData.value = {
    id: exam.id,
    vendorId: exam.vendorId,
    code: exam.examCode || exam.code,
    name: exam.examName || exam.name,
    description: exam.description || '',
    passingScore: exam.passingScore || 700,
    questionCount: exam.numberOfQuestions || exam.questionCount || 0,
    duration: exam.examDuration || exam.duration || 90,
    price: exam.price || 0,
    difficulty: exam.difficulty || 'intermediate',
    isActive: exam.isActive !== false,
    tags: exam.tags || []
  }
  dialog.value = true
}

const openDeleteDialog = (exam: Exam) => {
  selectedExam.value = exam
  deleteDialog.value = true
}

const cloneExam = (exam: Exam) => {
  editMode.value = false
  formData.value = {
    vendorId: exam.vendorId,
    code: exam.examCode || exam.code + '-COPY',
    name: (exam.examName || exam.name) + ' (Copy)',
    description: exam.description || '',
    passingScore: exam.passingScore || 700,
    questionCount: exam.numberOfQuestions || exam.questionCount || 0,
    duration: exam.examDuration || exam.duration || 90,
    price: exam.price || 0,
    difficulty: exam.difficulty || 'intermediate',
    isActive: true,
    tags: exam.tags || []
  }
  dialog.value = true
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
      difficulty: formData.value.difficulty,
      isActive: formData.value.isActive,
      tags: formData.value.tags
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
    useNuxtApp().$toast.success(editMode.value ? 'Exam updated successfully' : 'Exam created successfully')
  } catch (error) {
    console.error('Error saving exam:', error)
    useNuxtApp().$toast.error('Failed to save exam')
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
    useNuxtApp().$toast.success('Exam deleted successfully')
  } catch (error) {
    console.error('Error deleting exam:', error)
    useNuxtApp().$toast.error('Failed to delete exam')
  }
  loading.value = false
}

const bulkActivate = async (examIds: string[]) => {
  // Implementation for bulk activate
  console.log('Bulk activate:', examIds)
}

const bulkDeactivate = async (examIds: string[]) => {
  // Implementation for bulk deactivate
  console.log('Bulk deactivate:', examIds)
}

const exportExams = () => {
  // Implementation for export
  console.log('Export exams')
}

const resetFilters = () => {
  filters.value = {
    vendors: [],
    difficulty: [],
    status: 'all',
    priceRange: [0, 500]
  }
}

const formatDate = (timestamp: number | string) => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleDateString()
  }
  return new Date(timestamp * 1000).toLocaleDateString()
}

const getVendorName = (vendorId: string) => {
  const vendor = vendors.value.find((v: Vendor) => v.id === vendorId)
  return vendor?.name || 'Unknown'
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
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
              <h3 class="text-h3 font-weight-bold">{{ examStats.total }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Total Exams</p>
            </div>
            <Icon icon="solar:document-text-bold-duotone" size="48" class="text-primary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-success">{{ examStats.active }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Active Exams</p>
            </div>
            <Icon icon="solar:check-circle-bold-duotone" size="48" class="text-success" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-warning">{{ examStats.byDifficulty.intermediate }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Intermediate</p>
            </div>
            <Icon icon="solar:star-bold-duotone" size="48" class="text-warning" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-error">{{ examStats.byDifficulty.hard }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Hard Exams</p>
            </div>
            <Icon icon="solar:fire-bold-duotone" size="48" class="text-error" />
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
          
          <!-- Vendor Filter -->
          <div class="mb-6">
            <p class="text-body-2 font-weight-medium mb-2">Vendors</p>
            <v-chip-group
              v-model="filters.vendors"
              column
              multiple
              selected-class="text-primary"
            >
              <v-chip
                v-for="vendor in vendors"
                :key="vendor.id"
                :value="vendor.id"
                filter
                variant="outlined"
                size="small"
              >
                {{ vendor.name }}
              </v-chip>
            </v-chip-group>
          </div>
          
          <!-- Difficulty Filter -->
          <div class="mb-6">
            <p class="text-body-2 font-weight-medium mb-2">Difficulty</p>
            <v-chip-group
              v-model="filters.difficulty"
              column
              multiple
              selected-class="text-primary"
            >
              <v-chip
                value="easy"
                filter
                variant="outlined"
                size="small"
                color="success"
              >
                Easy
              </v-chip>
              <v-chip
                value="intermediate"
                filter
                variant="outlined"
                size="small"
                color="warning"
              >
                Intermediate
              </v-chip>
              <v-chip
                value="hard"
                filter
                variant="outlined"
                size="small"
                color="error"
              >
                Hard
              </v-chip>
            </v-chip-group>
          </div>
          
          <!-- Status Filter -->
          <div class="mb-6">
            <p class="text-body-2 font-weight-medium mb-2">Status</p>
            <v-radio-group
              v-model="filters.status"
              density="compact"
            >
              <v-radio label="All" value="all" />
              <v-radio label="Active" value="active" />
              <v-radio label="Inactive" value="inactive" />
            </v-radio-group>
          </div>
          
          <!-- Price Range Filter -->
          <div class="mb-6">
            <p class="text-body-2 font-weight-medium mb-2">Price Range</p>
            <v-range-slider
              v-model="filters.priceRange"
              :max="500"
              :min="0"
              :step="10"
              thumb-label="always"
              hide-details
              color="primary"
            >
              <template #thumb-label="{ modelValue }">
                ${{ modelValue }}
              </template>
            </v-range-slider>
          </div>
          
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
        <UiParentCard title="Exam Management">
          <AdminDataTable
            :headers="headers"
            :items="filteredExams"
            :loading="loading"
            table-class="examlist"
            search-label="Search exams..."
            create-button-text="Add New Exam"
            :show-select="true"
            :show-bulk-actions="true"
            empty-icon="solar:document-broken"
            empty-title="No exams found"
            empty-subtitle="Create your first exam to start building assessments"
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
              </v-btn>
              <v-btn
                variant="outlined"
                size="small"
                @click="exportExams"
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
            </template>

            <!-- Exam Column (Code + Name + Vendor) -->
            <template #item.exam="{ item }">
              <div class="py-2">
                <div class="d-flex align-center gap-1 mb-1">
                  <h6 class="text-h6 font-weight-medium">{{ item.examCode || item.code }}</h6>
                  <span class="text-body-2 text-medium-emphasis">—</span>
                  <span class="text-body-2">{{ item.examName || item.name }}</span>
                </div>
                <div class="d-flex align-center gap-2">
                  <v-chip size="x-small" variant="tonal" color="primary">
                    {{ getVendorName(item.vendorId) }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">
                    {{ item.description ? item.description.substring(0, 60) + '...' : '' }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Questions Column -->
            <template #item.questionCount="{ item }">
              <div class="text-center">
                <span class="font-weight-medium">{{ item.numberOfQuestions || item.questionCount || 0 }}</span>
              </div>
            </template>

            <!-- Difficulty Column -->
            <template #item.difficulty="{ item }">
              <DifficultyChip :difficulty="item.difficulty || 'intermediate'" />
            </template>

            <!-- Duration Column -->
            <template #item.duration="{ item }">
              <div class="d-flex align-center gap-1">
                <Icon icon="solar:clock-circle-line-duotone" size="16" />
                <span>{{ item.examDuration || item.duration || 90 }} min</span>
              </div>
            </template>

            <!-- Price Column -->
            <template #item.price="{ item }">
              <span class="font-weight-medium">{{ formatPrice(item.price || 0) }}</span>
            </template>

            <!-- Status Column -->
            <template #item.status="{ item }">
              <StatusIndicator :active="item.isActive !== false" />
            </template>

            <!-- Actions Column with Clone -->
            <template #item.actions="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="small"
                  >
                    <Icon icon="solar:menu-dots-bold" />
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="openEditDialog(item)">
                    <template #prepend>
                      <Icon icon="solar:pen-line-duotone" size="20" class="mr-3" />
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="cloneExam(item)">
                    <template #prepend>
                      <Icon icon="solar:copy-line-duotone" size="20" class="mr-3" />
                    </template>
                    <v-list-item-title>Clone</v-list-item-title>
                  </v-list-item>
                  <v-divider class="my-1" />
                  <v-list-item @click="openDeleteDialog(item)" class="text-error">
                    <template #prepend>
                      <Icon icon="solar:trash-bin-trash-line-duotone" size="20" class="mr-3" />
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </AdminDataTable>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card elevation="10">
        <v-card-title class="text-h5 pa-6 pb-3">
          {{ editMode ? 'Edit Exam' : 'Create New Exam' }}
        </v-card-title>
        
        <v-card-text class="pa-6 pt-0">
          <v-container class="pa-0">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.vendorId"
                  :items="vendors"
                  item-title="name"
                  item-value="id"
                  label="Vendor"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Vendor is required']"
                  required
                >
                  <template #prepend-inner>
                    <Icon icon="solar:buildings-line-duotone" size="20" />
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.code"
                  label="Exam Code"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., 220-1101"
                  :rules="[v => !!v || 'Exam code is required']"
                  required
                >
                  <template #prepend-inner>
                    <Icon icon="solar:hashtag-square-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  label="Exam Name"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., CompTIA A+ Core 1"
                  :rules="[v => !!v || 'Exam name is required']"
                  required
                >
                  <template #prepend-inner>
                    <Icon icon="solar:document-text-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  placeholder="Brief description of the exam..."
                />
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.difficulty"
                  :items="[
                    { title: 'Easy', value: 'easy' },
                    { title: 'Intermediate', value: 'intermediate' },
                    { title: 'Hard', value: 'hard' }
                  ]"
                  label="Difficulty"
                  variant="outlined"
                  density="comfortable"
                >
                  <template #prepend-inner>
                    <Icon icon="solar:star-line-duotone" size="20" />
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.passingScore"
                  label="Passing Score"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                  max="1000"
                  suffix="/ 1000"
                >
                  <template #prepend-inner>
                    <Icon icon="solar:target-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.questionCount"
                  label="Questions"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                >
                  <template #prepend-inner>
                    <Icon icon="solar:question-circle-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.duration"
                  label="Duration"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                  suffix="minutes"
                >
                  <template #prepend-inner>
                    <Icon icon="solar:clock-circle-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.price"
                  label="Price"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                  prefix="$"
                  hint="Enter price in cents (e.g., 29999 for $299.99)"
                  persistent-hint
                >
                  <template #prepend-inner>
                    <Icon icon="solar:dollar-minimalistic-line-duotone" size="20" />
                  </template>
                </v-text-field>
              </v-col>
              
              <v-col cols="12" md="4" class="d-flex align-center">
                <v-switch
                  v-model="formData.isActive"
                  label="Active"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="formData.tags"
                  label="Tags"
                  variant="outlined"
                  density="comfortable"
                  multiple
                  chips
                  closable-chips
                  hint="Press Enter to add tags"
                  persistent-hint
                >
                  <template #prepend-inner>
                    <Icon icon="solar:tag-line-duotone" size="20" />
                  </template>
                </v-combobox>
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
            @click="saveExam"
            :loading="loading"
            :disabled="!formData.name || !formData.code || !formData.vendorId"
          >
            {{ editMode ? 'Update Exam' : 'Create Exam' }}
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
          <h5 class="text-h5 mb-2">Delete Exam?</h5>
          <p class="text-body-1 text-medium-emphasis">
            Are you sure you want to delete <strong>{{ selectedExam?.examName || selectedExam?.name }}</strong>?
          </p>
          <v-alert
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            <Icon icon="solar:danger-triangle-line-duotone" size="20" class="mr-2" />
            This action will also delete all {{ selectedExam?.numberOfQuestions || selectedExam?.questionCount || 0 }} associated questions.
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
            @click="deleteExam"
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