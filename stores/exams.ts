import { defineStore } from 'pinia'
import type { Exam } from '~/types/exam'

interface ExamFilters {
  search: string
  vendors: string[]
  difficulty: string
  progress: string
  statuses: string[]
  sortBy: string
}

interface ExamState {
  exams: Exam[]
  loading: boolean
  error: string | null
  filters: ExamFilters
  pagination: {
    page: number
    perPage: number
    total: number
  }
}

export const useExamStore = defineStore('exams', {
  state: (): ExamState => ({
    exams: [],
    loading: false,
    error: null,
    filters: {
      search: '',
      vendors: [],
      difficulty: 'all',
      progress: 'all',
      statuses: ['active'],
      sortBy: 'popular'
    },
    pagination: {
      page: 1,
      perPage: 12,
      total: 0
    }
  }),

  getters: {
    // Filtered exams based on current filters
    filteredExams: (state) => {
      let filtered = [...state.exams]

      // Search filter
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(exam => 
          exam.code.toLowerCase().includes(searchLower) ||
          exam.name.toLowerCase().includes(searchLower) ||
          exam.vendorName?.toLowerCase().includes(searchLower)
        )
      }

      // Vendor filter
      if (state.filters.vendors.length > 0) {
        filtered = filtered.filter(exam => 
          state.filters.vendors.includes(exam.vendorId)
        )
      }

      // Difficulty filter
      if (state.filters.difficulty !== 'all') {
        filtered = filtered.filter(exam => 
          exam.difficulty === state.filters.difficulty
        )
      }

      // Progress filter
      if (state.filters.progress !== 'all') {
        filtered = filtered.filter(exam => {
          const progress = exam.userProgress || 0
          
          switch (state.filters.progress) {
            case '0':
              return progress === 0
            case '1-25':
              return progress >= 1 && progress <= 25
            case '26-50':
              return progress >= 26 && progress <= 50
            case '51-75':
              return progress >= 51 && progress <= 75
            case '76-99':
              return progress >= 76 && progress <= 99
            case '100':
              return progress === 100
            default:
              return true
          }
        })
      }

      // Status filter
      if (state.filters.statuses.length > 0) {
        filtered = filtered.filter(exam => {
          // Map exam properties to status
          const examStatuses: string[] = []
          
          if (exam.isActive) examStatuses.push('active')
          if (exam.userProgress === 100) examStatuses.push('completed')
          if (exam.isExpired) examStatuses.push('expired')
          if (exam.isBookmarked) examStatuses.push('bookmarked')
          
          return state.filters.statuses.some(status => 
            examStatuses.includes(status)
          )
        })
      }

      return filtered
    },

    // Sorted exams
    sortedExams: (state) => {
      const exams = [...state.filteredExams]
      
      switch (state.filters.sortBy) {
        case 'popular':
          return exams.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        case 'name':
          return exams.sort((a, b) => a.name.localeCompare(b.name))
        case 'progress':
          return exams.sort((a, b) => (b.userProgress || 0) - (a.userProgress || 0))
        case 'newest':
          return exams.sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
        default:
          return exams
      }
    },

    // Paginated exams
    paginatedExams: (state) => {
      const start = (state.pagination.page - 1) * state.pagination.perPage
      const end = start + state.pagination.perPage
      
      return state.sortedExams.slice(start, end)
    },

    // Total pages
    totalPages: (state) => {
      return Math.ceil(state.sortedExams.length / state.pagination.perPage)
    },

    // Check if filters are active
    hasActiveFilters: (state) => {
      return state.filters.search !== '' ||
        state.filters.vendors.length > 0 ||
        state.filters.difficulty !== 'all' ||
        state.filters.progress !== 'all' ||
        state.filters.statuses.length !== 1 ||
        state.filters.statuses[0] !== 'active'
    }
  },

  actions: {
    // Fetch exams from API
    async fetchExams() {
      this.loading = true
      this.error = null
      
      try {
        const { data } = await $fetch('/api/exams')
        this.exams = data.data || []
        this.pagination.total = this.exams.length
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch exams'
        console.error('Failed to fetch exams:', error)
      } finally {
        this.loading = false
      }
    },

    // Update filters
    updateFilters(filters: Partial<ExamFilters>) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // Reset to first page when filters change
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        search: '',
        vendors: [],
        difficulty: 'all',
        progress: 'all',
        statuses: ['active'],
        sortBy: 'popular'
      }
      this.pagination.page = 1
    },

    // Update search
    setSearch(search: string) {
      this.filters.search = search
      this.pagination.page = 1
    },

    // Update sort
    setSortBy(sortBy: string) {
      this.filters.sortBy = sortBy
    },

    // Update pagination
    setPage(page: number) {
      this.pagination.page = page
    },

    setPerPage(perPage: number) {
      this.pagination.perPage = perPage
      this.pagination.page = 1
    },

    // Toggle bookmark
    async toggleBookmark(examId: string) {
      const exam = this.exams.find(e => e.id === examId)
      if (!exam) return
      
      try {
        // Optimistic update
        exam.isBookmarked = !exam.isBookmarked
        
        // API call would go here
        // await $fetch(`/api/exams/${examId}/bookmark`, { method: 'POST' })
      } catch (error) {
        // Revert on error
        exam.isBookmarked = !exam.isBookmarked
        console.error('Failed to toggle bookmark:', error)
      }
    },

    // Update exam progress
    updateExamProgress(examId: string, progress: number) {
      const exam = this.exams.find(e => e.id === examId)
      if (exam) {
        exam.userProgress = progress
      }
    }
  }
})