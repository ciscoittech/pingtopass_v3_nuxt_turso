import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useActiveSession } from '~/composables/useActiveSession'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Replace global localStorage
vi.stubGlobal('localStorage', localStorageMock)

describe('useActiveSession', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('loadActiveSessions', () => {
    it('should load active sessions from localStorage', () => {
      const mockStudySessions = [
        {
          examId: 'exam1',
          examCode: 'AWS-SAA',
          examName: 'AWS Solutions Architect',
          mode: 'study',
          lastActivity: new Date('2024-01-01'),
          progress: 50
        }
      ]
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'activeStudySessions') {
          return JSON.stringify(mockStudySessions)
        }
        return null
      })

      const { activeStudySessions, loadActiveSessions } = useActiveSession()
      loadActiveSessions()

      expect(activeStudySessions.value).toHaveLength(1)
      expect(activeStudySessions.value[0].examCode).toBe('AWS-SAA')
    })

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const { activeStudySessions, loadActiveSessions } = useActiveSession()
      loadActiveSessions()

      expect(activeStudySessions.value).toHaveLength(0)
    })
  })

  describe('updateSession', () => {
    it('should add a new study session', () => {
      const { updateSession, activeStudySessions } = useActiveSession()
      
      const newSession = {
        examId: 'exam1',
        examCode: 'AWS-SAA',
        examName: 'AWS Solutions Architect',
        mode: 'study' as const,
        lastActivity: new Date(),
        progress: 0
      }

      updateSession(newSession)

      expect(activeStudySessions.value).toHaveLength(1)
      expect(activeStudySessions.value[0].examId).toBe('exam1')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'activeStudySessions',
        expect.any(String)
      )
    })

    it('should update existing session', () => {
      const { updateSession, activeStudySessions } = useActiveSession()
      
      const session1 = {
        examId: 'exam1',
        examCode: 'AWS-SAA',
        examName: 'AWS Solutions Architect',
        mode: 'study' as const,
        lastActivity: new Date(),
        progress: 0
      }

      const session2 = {
        ...session1,
        progress: 50
      }

      updateSession(session1)
      updateSession(session2)

      expect(activeStudySessions.value).toHaveLength(1)
      expect(activeStudySessions.value[0].progress).toBe(50)
    })

    it('should limit sessions to 5 most recent', () => {
      const { updateSession, activeStudySessions } = useActiveSession()
      
      // Add 6 sessions
      for (let i = 1; i <= 6; i++) {
        updateSession({
          examId: `exam${i}`,
          examCode: `CODE-${i}`,
          examName: `Exam ${i}`,
          mode: 'study',
          lastActivity: new Date(2024, 0, i),
          progress: i * 10
        })
      }

      expect(activeStudySessions.value).toHaveLength(5)
      // Should keep the 5 most recent (exam2 through exam6)
      expect(activeStudySessions.value[0].examId).toBe('exam6')
    })
  })

  describe('removeSession', () => {
    it('should remove a study session', () => {
      const { updateSession, removeSession, activeStudySessions } = useActiveSession()
      
      updateSession({
        examId: 'exam1',
        examCode: 'AWS-SAA',
        examName: 'AWS Solutions Architect',
        mode: 'study',
        lastActivity: new Date(),
        progress: 50
      })

      removeSession('exam1', 'study')

      expect(activeStudySessions.value).toHaveLength(0)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2) // Once for add, once for remove
    })
  })

  describe('getDynamicSidebarItems', () => {
    it('should return continue learning item for last activity', () => {
      const { updateSession, getDynamicSidebarItems } = useActiveSession()
      
      updateSession({
        examId: 'exam1',
        examCode: 'AWS-SAA',
        examName: 'AWS Solutions Architect',
        mode: 'study',
        lastActivity: new Date(),
        progress: 50
      })

      const items = getDynamicSidebarItems()

      expect(items).toHaveLength(1)
      expect(items[0].title).toContain('Continue Studying')
      expect(items[0].title).toContain('AWS-SAA')
      expect(items[0].to).toBe('/study/exam1')
    })

    it('should return test resume item for in-progress test', () => {
      const { updateSession, getDynamicSidebarItems } = useActiveSession()
      
      updateSession({
        examId: 'exam1',
        examCode: 'AWS-SAA',
        examName: 'AWS Solutions Architect',
        mode: 'test',
        lastActivity: new Date(),
        progress: 30
      })

      const items = getDynamicSidebarItems()

      expect(items).toHaveLength(1)
      expect(items[0].title).toContain('Continue Test')
      expect(items[0].to).toBe('/test/exam1')
    })

    it('should return empty array when no active sessions', () => {
      const { getDynamicSidebarItems } = useActiveSession()
      const items = getDynamicSidebarItems()
      expect(items).toHaveLength(0)
    })
  })

  describe('getQuickActions', () => {
    it('should return continue action for last activity', () => {
      const { updateSession, getQuickActions } = useActiveSession()
      
      updateSession({
        examId: 'exam1',
        examCode: 'AWS-SAA',
        examName: 'AWS Solutions Architect',
        mode: 'study',
        lastActivity: new Date(),
        progress: 50
      })

      const actions = getQuickActions()

      expect(actions).toHaveLength(1)
      expect(actions[0].id).toBe('continue-last')
      expect(actions[0].title).toContain('AWS-SAA')
      expect(actions[0].to).toBe('/study/exam1')
    })

    it('should return browse exams action when no sessions', () => {
      const { getQuickActions } = useActiveSession()
      const actions = getQuickActions()

      expect(actions).toHaveLength(1)
      expect(actions[0].id).toBe('browse-exams')
      expect(actions[0].to).toBe('/exams')
    })
  })
})