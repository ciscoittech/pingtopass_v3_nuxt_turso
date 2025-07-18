import type { Exam } from '~/types/exam'

interface ActiveSession {
  examId: string
  examCode: string
  examName: string
  mode: 'study' | 'test'
  lastActivity: Date
  progress?: number
  questionsAnswered?: number
}

export const useActiveSession = () => {
  const activeStudySessions = ref<ActiveSession[]>([])
  const activeTestSessions = ref<ActiveSession[]>([])
  const lastActivity = ref<ActiveSession | null>(null)

  // Load active sessions from localStorage
  const loadActiveSessions = () => {
    if (typeof window !== 'undefined') {
      try {
        // Load study sessions
        const studyData = localStorage.getItem('activeStudySessions')
        if (studyData) {
          activeStudySessions.value = JSON.parse(studyData)
        }

        // Load test sessions
        const testData = localStorage.getItem('activeTestSessions')
        if (testData) {
          activeTestSessions.value = JSON.parse(testData)
        }

        // Load last activity
        const lastData = localStorage.getItem('lastStudyActivity')
        if (lastData) {
          lastActivity.value = JSON.parse(lastData)
        }
      } catch (error) {
        console.error('Failed to load active sessions:', error)
      }
    }
  }

  // Save active sessions to localStorage
  const saveActiveSessions = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeStudySessions', JSON.stringify(activeStudySessions.value))
        localStorage.setItem('activeTestSessions', JSON.stringify(activeTestSessions.value))
        if (lastActivity.value) {
          localStorage.setItem('lastStudyActivity', JSON.stringify(lastActivity.value))
        }
      } catch (error) {
        console.error('Failed to save active sessions:', error)
      }
    }
  }

  // Add or update a session
  const updateSession = (session: ActiveSession) => {
    const targetArray = session.mode === 'study' ? activeStudySessions : activeTestSessions
    const existingIndex = targetArray.value.findIndex(s => s.examId === session.examId)
    
    if (existingIndex >= 0) {
      targetArray.value[existingIndex] = session
    } else {
      targetArray.value.push(session)
    }
    
    // Keep only the 5 most recent sessions
    targetArray.value = targetArray.value
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 5)
    
    lastActivity.value = session
    saveActiveSessions()
  }

  // Remove a session
  const removeSession = (examId: string, mode: 'study' | 'test') => {
    if (mode === 'study') {
      activeStudySessions.value = activeStudySessions.value.filter(s => s.examId !== examId)
    } else {
      activeTestSessions.value = activeTestSessions.value.filter(s => s.examId !== examId)
    }
    saveActiveSessions()
  }

  // Get dynamic sidebar items
  const getDynamicSidebarItems = () => {
    const items: any[] = []

    // Add continue learning section if there are active sessions
    if (lastActivity.value) {
      items.push({
        title: `Continue ${lastActivity.value.mode === 'study' ? 'Studying' : 'Test'}: ${lastActivity.value.examCode}`,
        icon: lastActivity.value.mode === 'study' ? 'book-2-linear' : 'timer-start-linear',
        BgColor: 'primary',
        to: `/${lastActivity.value.mode}/${lastActivity.value.examId}`,
        chip: 'Resume',
        chipColor: 'success',
        chipVariant: 'flat'
      })
    }

    // Add recent study sessions
    if (activeStudySessions.value.length > 0 && !lastActivity.value?.mode || lastActivity.value?.mode !== 'study') {
      const recentStudy = activeStudySessions.value[0]
      items.push({
        title: `Study: ${recentStudy.examCode}`,
        icon: 'book-linear',
        BgColor: 'info',
        to: `/study/${recentStudy.examId}`,
        subCaption: `${recentStudy.progress || 0}% complete`
      })
    }

    // Add in-progress tests
    const inProgressTests = activeTestSessions.value.filter(t => t.progress && t.progress < 100)
    if (inProgressTests.length > 0) {
      items.push({
        title: `Resume Test: ${inProgressTests[0].examCode}`,
        icon: 'timer-pause-linear',
        BgColor: 'warning',
        to: `/test/${inProgressTests[0].examId}`,
        chip: `${inProgressTests[0].progress}%`,
        chipColor: 'warning',
        chipVariant: 'tonal'
      })
    }

    return items
  }

  // Get quick action items for dashboard
  const getQuickActions = () => {
    const actions: any[] = []

    if (lastActivity.value) {
      actions.push({
        id: 'continue-last',
        title: `Continue ${lastActivity.value.examCode}`,
        subtitle: lastActivity.value.mode === 'study' ? 'Resume studying' : 'Resume test',
        icon: lastActivity.value.mode === 'study' ? 'solar:book-bold-duotone' : 'solar:timer-start-bold-duotone',
        color: 'primary',
        to: `/${lastActivity.value.mode}/${lastActivity.value.examId}`
      })
    }

    // Add browse exams if no sessions
    if (activeStudySessions.value.length === 0 && activeTestSessions.value.length === 0) {
      actions.push({
        id: 'browse-exams',
        title: 'Browse Exams',
        subtitle: 'Start your certification journey',
        icon: 'solar:document-text-bold-duotone',
        color: 'success',
        to: '/exams'
      })
    }

    return actions
  }

  // Initialize on mount
  onMounted(() => {
    loadActiveSessions()
  })

  return {
    activeStudySessions: readonly(activeStudySessions),
    activeTestSessions: readonly(activeTestSessions),
    lastActivity: readonly(lastActivity),
    updateSession,
    removeSession,
    getDynamicSidebarItems,
    getQuickActions,
    loadActiveSessions
  }
}