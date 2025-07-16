<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 font-weight-bold mb-2">Exam Components Test Page</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">
          Testing integration of all new exam components with Spike theme patterns
        </p>
      </v-col>
    </v-row>

    <!-- Exam Filters -->
    <ExamFilters
      :vendors="vendors"
      :filters="examStore.filters"
      :hasActiveFilters="examStore.hasActiveFilters"
      @update:filters="examStore.updateFilters"
      @update:search="examStore.setSearch"
      @update:sort="examStore.setSortBy"
      @reset="examStore.resetFilters"
    />

    <!-- Base Card with Content -->
    <ExamBaseCard>
      <template #content>
        <!-- Loading State -->
        <LoadingSkeleton
          v-if="examStore.loading"
          type="card-grid"
          :count="6"
          :cardHeight="400"
        />

        <!-- Empty State -->
        <ExamEmptyState
          v-else-if="!examStore.loading && examStore.paginatedExams.length === 0"
          title="No Exams Found"
          subtitle="Try adjusting your filters or browse all available exams"
          primaryActionText="Clear Filters"
          secondaryActionText="Browse All Exams"
          @primary-action="examStore.resetFilters"
          @secondary-action="navigateTo('/exams')"
        />

        <!-- Exam Grid -->
        <v-row v-else>
          <v-col
            v-for="exam in examStore.paginatedExams"
            :key="exam.id"
            cols="12"
            md="6"
            lg="4"
          >
            <ExamCard
              :exam="exam"
              @toggle-bookmark="examStore.toggleBookmark(exam.id)"
              @view-details="navigateTo(`/exams/${exam.code}`)"
              @start-exam="startExam(exam)"
            />
          </v-col>
        </v-row>

        <!-- Pagination -->
        <v-row v-if="examStore.totalPages > 1" class="mt-6">
          <v-col cols="12">
            <v-pagination
              v-model="examStore.pagination.page"
              :length="examStore.totalPages"
              :total-visible="7"
              rounded="circle"
              @update:model-value="examStore.setPage"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Mobile Filters -->
      <template #mobileFilters>
        <ExamMobileFilters
          :vendors="vendors"
          :modelValue="{
            vendors: examStore.filters.vendors,
            difficulty: examStore.filters.difficulty,
            progress: examStore.filters.progress,
            statuses: examStore.filters.statuses
          }"
          @update:modelValue="examStore.updateFilters"
        />
      </template>
    </ExamBaseCard>

    <!-- Test Controls -->
    <v-row class="mt-8">
      <v-col cols="12">
        <v-card>
          <v-card-title>Test Controls</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-btn
                  color="primary"
                  block
                  @click="loadMockData"
                  :loading="loading"
                >
                  Load Mock Data
                </v-btn>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="secondary"
                  block
                  @click="testFilters"
                >
                  Test Filters
                </v-btn>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="warning"
                  block
                  @click="clearData"
                >
                  Clear Data
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useExamStore } from '~/stores/exams'
import type { Exam } from '~/types/exam'

// Page meta
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

// Store
const examStore = useExamStore()

// Local state
const loading = ref(false)

// Mock vendors
const vendors = ref([
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'aws', name: 'Amazon AWS' },
  { id: 'google', name: 'Google Cloud' },
  { id: 'cisco', name: 'Cisco' },
  { id: 'comptia', name: 'CompTIA' }
])

// Mock exam data
const mockExams: Exam[] = [
  {
    id: '1',
    code: 'AZ-900',
    name: 'Azure Fundamentals',
    vendorId: 'microsoft',
    vendorName: 'Microsoft',
    difficulty: 'beginner',
    userProgress: 75,
    isActive: true,
    isBookmarked: true,
    popularity: 95,
    questionCount: 60,
    passRate: 85,
    duration: 90,
    price: 99,
    description: 'Foundational level knowledge of cloud services and Azure',
    tags: ['cloud', 'azure', 'fundamentals'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    code: 'AWS-SAA-C03',
    name: 'AWS Solutions Architect - Associate',
    vendorId: 'aws',
    vendorName: 'Amazon AWS',
    difficulty: 'intermediate',
    userProgress: 30,
    isActive: true,
    isBookmarked: false,
    popularity: 98,
    questionCount: 65,
    passRate: 72,
    duration: 130,
    price: 150,
    description: 'Design distributed systems on AWS',
    tags: ['cloud', 'aws', 'architecture'],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-20'
  },
  {
    id: '3',
    code: 'GCP-ACE',
    name: 'Google Cloud Associate Cloud Engineer',
    vendorId: 'google',
    vendorName: 'Google Cloud',
    difficulty: 'intermediate',
    userProgress: 0,
    isActive: true,
    isBookmarked: false,
    popularity: 85,
    questionCount: 50,
    passRate: 78,
    duration: 120,
    price: 125,
    description: 'Deploy and manage Google Cloud solutions',
    tags: ['cloud', 'gcp', 'engineering'],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25'
  },
  {
    id: '4',
    code: 'CCNA-200-301',
    name: 'Cisco Certified Network Associate',
    vendorId: 'cisco',
    vendorName: 'Cisco',
    difficulty: 'intermediate',
    userProgress: 100,
    isActive: true,
    isBookmarked: true,
    popularity: 90,
    questionCount: 120,
    passRate: 68,
    duration: 120,
    price: 300,
    description: 'Network fundamentals and Cisco technologies',
    tags: ['networking', 'cisco', 'routing'],
    createdAt: '2024-01-03',
    updatedAt: '2024-01-18'
  },
  {
    id: '5',
    code: 'CompTIA-A+',
    name: 'CompTIA A+ Core 1',
    vendorId: 'comptia',
    vendorName: 'CompTIA',
    difficulty: 'beginner',
    userProgress: 45,
    isActive: true,
    isBookmarked: false,
    popularity: 88,
    questionCount: 90,
    passRate: 82,
    duration: 90,
    price: 239,
    description: 'IT operational roles and maintenance',
    tags: ['hardware', 'troubleshooting', 'it-support'],
    createdAt: '2024-01-07',
    updatedAt: '2024-01-22'
  },
  {
    id: '6',
    code: 'AZ-104',
    name: 'Azure Administrator Associate',
    vendorId: 'microsoft',
    vendorName: 'Microsoft',
    difficulty: 'intermediate',
    userProgress: 60,
    isActive: true,
    isBookmarked: false,
    popularity: 92,
    questionCount: 60,
    passRate: 75,
    duration: 150,
    price: 165,
    description: 'Implement, manage, and monitor Azure environments',
    tags: ['cloud', 'azure', 'administration'],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-27',
    isExpired: false
  },
  {
    id: '7',
    code: 'Security+',
    name: 'CompTIA Security+',
    vendorId: 'comptia',
    vendorName: 'CompTIA',
    difficulty: 'intermediate',
    userProgress: 10,
    isActive: false,
    isBookmarked: false,
    popularity: 94,
    questionCount: 90,
    passRate: 74,
    duration: 90,
    price: 392,
    description: 'Baseline cybersecurity skills',
    tags: ['security', 'cybersecurity', 'comptia'],
    createdAt: '2023-12-01',
    updatedAt: '2023-12-15',
    isExpired: true
  }
]

// Methods
const loadMockData = async () => {
  loading.value = true
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Load mock data directly into store
  examStore.exams = mockExams
  examStore.pagination.total = mockExams.length
  
  loading.value = false
}

const testFilters = () => {
  // Test various filter combinations
  const filterTests = [
    { vendors: ['microsoft'] },
    { difficulty: 'intermediate' },
    { progress: '51-75' },
    { statuses: ['bookmarked'] },
    { search: 'Azure' }
  ]
  
  let index = 0
  const interval = setInterval(() => {
    if (index >= filterTests.length) {
      clearInterval(interval)
      examStore.resetFilters()
      return
    }
    
    examStore.updateFilters(filterTests[index])
    index++
  }, 2000)
}

const clearData = () => {
  examStore.exams = []
  examStore.pagination.total = 0
  examStore.resetFilters()
}

const startExam = (exam: Exam) => {
  // Navigate to study mode for the exam
  navigateTo(`/study/${exam.id}`)
}

// Load mock data on mount
onMounted(() => {
  if (examStore.exams.length === 0) {
    loadMockData()
  }
})
</script>