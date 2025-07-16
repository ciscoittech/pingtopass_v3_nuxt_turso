<script setup lang="ts">
import ExamTopFilter from '@/components/exam/ExamTopFilter.vue'
import ExamGridCard from '@/components/exam/ExamGridCard.vue'
import ExamEmptyState from '@/components/exam/ExamEmptyState.vue'
import { useExamStore } from '~/stores/exams'
import type { Exam } from '~/types/exam'

// Require authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Page setup
useSeoMeta({
  title: 'IT Certification Exams - PingToPass',
  description: 'Browse and practice IT certification exams from Microsoft, AWS, Google Cloud, Cisco, CompTIA and more.'
})

// Breadcrumb
const page = ref({ title: 'Certification Exams' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Exam Catalog',
    disabled: true,
    to: ''
  }
])

// Store
const examStore = useExamStore()

// Fetch vendors
const { data: vendorsData } = await useFetch('/api/vendors')
const vendors = computed(() => vendorsData.value?.data || [])

// Load exams on mount
onMounted(async () => {
  if (examStore.exams.length === 0) {
    await loadExams()
  }
})

// Filter state
const filterState = ref({
  vendor: null as string | null,
  difficulty: null as string | null,
  status: null as string | null,
  sortBy: 'popularity'
})

// Load exams with mapping
async function loadExams() {
  examStore.loading = true
  try {
    const response = await $fetch('/api/exams')
    
    // Ensure we have the correct data structure
    const examResult = response.data || {}
    const examsData = examResult.exams || []
    
    // Ensure examsData is an array before mapping
    if (!Array.isArray(examsData)) {
      console.warn('Expected examsData to be an array, got:', typeof examsData, examsData)
      examStore.exams = []
      examStore.pagination.total = 0
      return
    }
    
    // Map to match the expected format
    const mappedExams = examsData.map((exam: any) => ({
      id: exam.id,
      examCode: exam.examCode || exam.code,
      examName: exam.examName || exam.name,
      vendorId: exam.vendorId,
      vendorName: exam.vendor?.name || exam.vendorName || 'Unknown Vendor',
      vendor: exam.vendor || { name: exam.vendorName || 'Unknown' },
      difficulty: exam.difficulty || 'intermediate',
      userProgress: exam.userProgress || 0,
      isActive: exam.isActive !== false,
      isBookmarked: exam.isBookmarked || false,
      numberOfQuestions: exam.numberOfQuestions || exam.totalQuestions || exam.questionCount || 0,
      passingScore: exam.passingScore || exam.passRate || 70,
      examDuration: exam.examDuration || exam.duration || 90,
      price: exam.price || 0,
      description: exam.description || `Practice exam for ${exam.examName || exam.name}`,
      tags: exam.tags || [],
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt
    }))
    
    examStore.exams = mappedExams
    examStore.pagination.total = examResult.total || mappedExams.length
  } catch (error) {
    console.error('Failed to load exams:', error)
    examStore.error = 'Failed to load exams'
  } finally {
    examStore.loading = false
  }
}

// Handle filter updates
const handleFilterUpdate = (filters: any) => {
  if (filters.vendor !== undefined) filterState.value.vendor = filters.vendor
  if (filters.difficulty !== undefined) filterState.value.difficulty = filters.difficulty
  if (filters.status !== undefined) filterState.value.status = filters.status
  
  // Update store filters
  examStore.updateFilters({
    vendors: filters.vendor ? [filters.vendor] : [],
    difficulty: filters.difficulty || 'all',
    statuses: filters.status ? [filters.status] : ['active']
  })
}

// Actions
const startExam = (exam: any) => {
  navigateTo(`/study/${exam.id}`)
}

const viewExamDetails = (exam: Exam) => {
  navigateTo(`/exams/${exam.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">IT Certification Exam Catalog</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Choose from {{ examStore.exams.length }} certification exams to advance your IT career
        </p>
      </v-col>
    </v-row>

    <!-- Top Filter Bar -->
    <ExamTopFilter
      :vendors="vendors"
      v-model="filterState"
      @filter="handleFilterUpdate"
      @sort="examStore.setSortBy"
    />

    <!-- Main Content -->
    <div>
      <!-- Loading State -->
      <v-row v-if="examStore.loading">
        <v-col
          v-for="i in 12"
          :key="`skeleton-${i}`"
          cols="12"
          sm="6"
          lg="4"
        >
          <v-skeleton-loader
            type="card"
            height="320"
          />
        </v-col>
      </v-row>

      <!-- Empty State -->
      <ExamEmptyState
        v-else-if="!examStore.loading && examStore.paginatedExams.length === 0"
        :image="examStore.hasActiveFilters ? '/images/empty-states/no-results.svg' : '/images/empty-states/no-exams.svg'"
        :title="examStore.hasActiveFilters ? 'No exams match your filters' : 'No exams available'"
        :subtitle="examStore.hasActiveFilters ? 'Try adjusting your filters or search criteria' : 'Check back later for new certification exams'"
        :primaryActionText="examStore.hasActiveFilters ? 'Clear Filters' : 'Refresh'"
        :showDefaultActions="examStore.hasActiveFilters"
        @primary-action="examStore.hasActiveFilters ? examStore.resetFilters() : loadExams()"
      />

      <!-- Exam Grid -->
      <div v-else>
        <!-- Results Count -->
        <div class="mb-4">
          <p class="text-body-2 text-medium-emphasis">
            Showing {{ examStore.paginatedExams.length }} of {{ examStore.filteredExams.length }} exams
          </p>
        </div>

        <!-- Exam Cards Grid -->
        <v-row>
          <v-col
            v-for="exam in examStore.paginatedExams"
            :key="exam.id"
            cols="12"
            sm="6"
            lg="4"
          >
            <ExamGridCard
              :exam="exam"
              @bookmark="examStore.toggleBookmark(exam.id)"
            />
          </v-col>
        </v-row>

        <!-- Pagination -->
        <v-row v-if="examStore.totalPages > 1" class="mt-8">
          <v-col cols="12" class="d-flex justify-center">
            <v-pagination
              v-model="examStore.pagination.page"
              :length="examStore.totalPages"
              :total-visible="$vuetify.display.mobile ? 5 : 7"
              rounded="pill"
              color="primary"
              @update:model-value="examStore.setPage"
            />
          </v-col>
        </v-row>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page specific styles if needed */
</style>