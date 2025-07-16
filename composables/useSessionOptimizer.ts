export const useSessionOptimizer = () => {
  // Debounced auto-save for better performance
  const pendingUpdates = ref<Record<string, any>>({})
  const saveTimer = ref<NodeJS.Timeout | null>(null)
  
  // Batch updates to reduce API calls
  const queueUpdate = (sessionId: string, updates: Record<string, any>) => {
    pendingUpdates.value = { ...pendingUpdates.value, ...updates }
    
    // Clear existing timer
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
    }
    
    // Set new timer for batch save
    saveTimer.value = setTimeout(() => {
      performBatchSave(sessionId)
    }, 2000) // 2 second debounce
  }
  
  // Perform the actual save
  const performBatchSave = async (sessionId: string) => {
    if (Object.keys(pendingUpdates.value).length === 0) return
    
    const updates = { ...pendingUpdates.value }
    pendingUpdates.value = {}
    
    try {
      await $fetch(`/api/sessions/study/${sessionId}`, {
        method: 'PUT',
        body: updates
      })
    } catch (error) {
      console.error('Failed to save session updates:', error)
      // Re-queue failed updates
      pendingUpdates.value = { ...pendingUpdates.value, ...updates }
    }
  }
  
  // Force save immediately (useful before navigation)
  const forceSave = async (sessionId: string) => {
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
      saveTimer.value = null
    }
    
    if (Object.keys(pendingUpdates.value).length > 0) {
      await performBatchSave(sessionId)
    }
  }
  
  // Optimized answer validation
  const validateAnswerOptimized = (
    selectedAnswers: number[],
    correctAnswers: number[],
    questionType: string
  ): boolean => {
    // Fast path for single choice
    if (questionType === 'multiple-choice') {
      return selectedAnswers.length === 1 && 
             correctAnswers.length === 1 && 
             selectedAnswers[0] === correctAnswers[0]
    }
    
    // Multiple answer validation
    if (selectedAnswers.length !== correctAnswers.length) return false
    
    // Use Set for O(1) lookups
    const correctSet = new Set(correctAnswers)
    return selectedAnswers.every(ans => correctSet.has(ans))
  }
  
  // Efficient session statistics calculation
  const calculateStats = (answers: Record<string, any>) => {
    let correct = 0
    let incorrect = 0
    let totalTime = 0
    
    for (const answer of Object.values(answers)) {
      if (answer.isCorrect) correct++
      else incorrect++
      totalTime += answer.timeSpent || 0
    }
    
    const total = correct + incorrect
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const avgTime = total > 0 ? Math.round(totalTime / total) : 0
    
    return { correct, incorrect, total, accuracy, totalTime, avgTime }
  }
  
  // Memory-efficient question navigation
  const createNavigationWindow = (
    currentIndex: number,
    totalQuestions: number,
    windowSize: number = 5
  ) => {
    const halfWindow = Math.floor(windowSize / 2)
    let start = Math.max(0, currentIndex - halfWindow)
    let end = Math.min(totalQuestions, start + windowSize)
    
    // Adjust start if we're near the end
    if (end === totalQuestions) {
      start = Math.max(0, end - windowSize)
    }
    
    return { start, end }
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
    }
  })
  
  return {
    queueUpdate,
    forceSave,
    validateAnswerOptimized,
    calculateStats,
    createNavigationWindow
  }
}