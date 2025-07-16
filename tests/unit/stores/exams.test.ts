import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExamStore } from '~/stores/exams'
import type { Exam } from '~/types/exam'

// Mock $fetch
global.$fetch = vi.fn()

describe('Exam Store', () => {
  let store: ReturnType<typeof useExamStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useExamStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.exams).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.filters.search).toBe('')
      expect(store.filters.vendors).toEqual([])
      expect(store.filters.difficulty).toBe('all')
      expect(store.filters.progress).toBe('all')
      expect(store.filters.statuses).toEqual(['active'])
      expect(store.filters.sortBy).toBe('popular')
      expect(store.pagination.page).toBe(1)
      expect(store.pagination.perPage).toBe(12)
    })
  })

  describe('Actions', () => {
    const mockExams: Exam[] = [
      {
        id: '1',
        code: 'AZ-900',
        name: 'Azure Fundamentals',
        vendorId: 'microsoft',
        vendorName: 'Microsoft',
        difficulty: 'beginner',
        userProgress: 50,
        isActive: true,
        isBookmarked: false,
        popularity: 100,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        code: 'AWS-SAA',
        name: 'AWS Solutions Architect',
        vendorId: 'aws',
        vendorName: 'Amazon',
        difficulty: 'intermediate',
        userProgress: 0,
        isActive: true,
        isBookmarked: true,
        popularity: 90,
        createdAt: '2024-01-02'
      }
    ]

    describe('fetchExams', () => {
      it('should fetch exams successfully', async () => {
        vi.mocked($fetch).mockResolvedValue({ data: { data: mockExams } })

        await store.fetchExams()

        expect($fetch).toHaveBeenCalledWith('/api/exams')
        expect(store.exams).toEqual(mockExams)
        expect(store.pagination.total).toBe(2)
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should handle fetch error', async () => {
        const error = new Error('Network error')
        vi.mocked($fetch).mockRejectedValue(error)

        await store.fetchExams()

        expect(store.error).toBe('Network error')
        expect(store.loading).toBe(false)
      })
    })

    describe('updateFilters', () => {
      it('should update filters and reset page', () => {
        store.pagination.page = 3
        
        store.updateFilters({
          search: 'Azure',
          difficulty: 'beginner'
        })

        expect(store.filters.search).toBe('Azure')
        expect(store.filters.difficulty).toBe('beginner')
        expect(store.pagination.page).toBe(1)
      })
    })

    describe('resetFilters', () => {
      it('should reset all filters to defaults', () => {
        store.filters = {
          search: 'test',
          vendors: ['microsoft'],
          difficulty: 'advanced',
          progress: '100',
          statuses: ['completed', 'bookmarked'],
          sortBy: 'name'
        }
        store.pagination.page = 5

        store.resetFilters()

        expect(store.filters).toEqual({
          search: '',
          vendors: [],
          difficulty: 'all',
          progress: 'all',
          statuses: ['active'],
          sortBy: 'popular'
        })
        expect(store.pagination.page).toBe(1)
      })
    })

    describe('toggleBookmark', () => {
      beforeEach(() => {
        store.exams = [...mockExams]
      })

      it('should toggle bookmark status', async () => {
        const exam = store.exams[0]
        expect(exam.isBookmarked).toBe(false)

        await store.toggleBookmark('1')

        expect(exam.isBookmarked).toBe(true)
      })

      it('should do nothing if exam not found', async () => {
        await store.toggleBookmark('999')
        
        expect(store.exams[0].isBookmarked).toBe(false)
        expect(store.exams[1].isBookmarked).toBe(true)
      })
    })

    describe('updateExamProgress', () => {
      beforeEach(() => {
        store.exams = [...mockExams]
      })

      it('should update exam progress', () => {
        store.updateExamProgress('1', 75)
        
        expect(store.exams[0].userProgress).toBe(75)
      })

      it('should do nothing if exam not found', () => {
        store.updateExamProgress('999', 75)
        
        expect(store.exams[0].userProgress).toBe(50)
        expect(store.exams[1].userProgress).toBe(0)
      })
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      store.exams = [
        {
          id: '1',
          code: 'AZ-900',
          name: 'Azure Fundamentals',
          vendorId: 'microsoft',
          vendorName: 'Microsoft',
          difficulty: 'beginner',
          userProgress: 0,
          isActive: true,
          isBookmarked: false,
          popularity: 100
        },
        {
          id: '2',
          code: 'AWS-SAA',
          name: 'AWS Solutions Architect',
          vendorId: 'aws',
          vendorName: 'Amazon',
          difficulty: 'intermediate',
          userProgress: 50,
          isActive: true,
          isBookmarked: true,
          popularity: 90
        },
        {
          id: '3',
          code: 'GCP-ACE',
          name: 'Google Cloud Associate',
          vendorId: 'google',
          vendorName: 'Google',
          difficulty: 'intermediate',
          userProgress: 100,
          isActive: true,
          isBookmarked: false,
          popularity: 80
        }
      ]
    })

    describe('filteredExams', () => {
      it('should filter by search term', () => {
        store.filters.search = 'aws'
        
        const filtered = store.filteredExams
        expect(filtered.length).toBe(1)
        expect(filtered[0].code).toBe('AWS-SAA')
      })

      it('should filter by vendor', () => {
        store.filters.vendors = ['microsoft', 'google']
        
        const filtered = store.filteredExams
        expect(filtered.length).toBe(2)
        expect(filtered.map(e => e.vendorId)).toEqual(['microsoft', 'google'])
      })

      it('should filter by difficulty', () => {
        store.filters.difficulty = 'intermediate'
        
        const filtered = store.filteredExams
        expect(filtered.length).toBe(2)
        expect(filtered.every(e => e.difficulty === 'intermediate')).toBe(true)
      })

      it('should filter by progress ranges', () => {
        store.filters.progress = '26-50'
        
        const filtered = store.filteredExams
        expect(filtered.length).toBe(1)
        expect(filtered[0].userProgress).toBe(50)
      })

      it('should filter by status', () => {
        store.filters.statuses = ['bookmarked']
        
        const filtered = store.filteredExams
        expect(filtered.length).toBe(1)
        expect(filtered[0].isBookmarked).toBe(true)
      })

      it('should apply multiple filters', () => {
        store.filters.difficulty = 'intermediate'
        store.filters.statuses = ['bookmarked']
        
        const filtered = store.filteredExams
        expect(filtered.length).toBe(1)
        expect(filtered[0].code).toBe('AWS-SAA')
      })
    })

    describe('sortedExams', () => {
      it('should sort by popularity', () => {
        store.filters.sortBy = 'popular'
        
        const sorted = store.sortedExams
        expect(sorted[0].popularity).toBe(100)
        expect(sorted[1].popularity).toBe(90)
        expect(sorted[2].popularity).toBe(80)
      })

      it('should sort by name', () => {
        store.filters.sortBy = 'name'
        
        const sorted = store.sortedExams
        expect(sorted[0].name).toBe('AWS Solutions Architect')
        expect(sorted[1].name).toBe('Azure Fundamentals')
        expect(sorted[2].name).toBe('Google Cloud Associate')
      })

      it('should sort by progress', () => {
        store.filters.sortBy = 'progress'
        
        const sorted = store.sortedExams
        expect(sorted[0].userProgress).toBe(100)
        expect(sorted[1].userProgress).toBe(50)
        expect(sorted[2].userProgress).toBe(0)
      })
    })

    describe('paginatedExams', () => {
      it('should paginate correctly', () => {
        store.pagination.perPage = 2
        store.pagination.page = 1
        
        let paginated = store.paginatedExams
        expect(paginated.length).toBe(2)
        expect(paginated[0].id).toBe('1')
        expect(paginated[1].id).toBe('2')
        
        store.pagination.page = 2
        paginated = store.paginatedExams
        expect(paginated.length).toBe(1)
        expect(paginated[0].id).toBe('3')
      })
    })

    describe('hasActiveFilters', () => {
      it('should return false for default filters', () => {
        expect(store.hasActiveFilters).toBe(false)
      })

      it('should return true when filters are active', () => {
        store.filters.search = 'test'
        expect(store.hasActiveFilters).toBe(true)
        
        store.filters.search = ''
        store.filters.vendors = ['microsoft']
        expect(store.hasActiveFilters).toBe(true)
        
        store.filters.vendors = []
        store.filters.difficulty = 'beginner'
        expect(store.hasActiveFilters).toBe(true)
      })
    })

    describe('totalPages', () => {
      it('should calculate total pages correctly', () => {
        store.pagination.perPage = 2
        expect(store.totalPages).toBe(2)
        
        store.pagination.perPage = 1
        expect(store.totalPages).toBe(3)
        
        store.pagination.perPage = 10
        expect(store.totalPages).toBe(1)
      })
    })
  })
})