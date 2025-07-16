export const useQuestionLoader = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const questionsCache = ref<Map<string, any>>(new Map())
  
  // Preload questions in batches for better performance
  const preloadQuestions = async (questionIds: string[], batchSize = 10) => {
    const unloadedIds = questionIds.filter(id => !questionsCache.value.has(id))
    
    if (unloadedIds.length === 0) {
      return Array.from(questionsCache.value.values())
    }
    
    loading.value = true
    error.value = null
    
    try {
      // Load in batches to avoid overwhelming the server
      const batches = []
      for (let i = 0; i < unloadedIds.length; i += batchSize) {
        batches.push(unloadedIds.slice(i, i + batchSize))
      }
      
      const results = await Promise.all(
        batches.map(batch => 
          $fetch('/api/questions/batch', {
            method: 'POST',
            body: { questionIds: batch }
          })
        )
      )
      
      // Cache the results
      results.forEach(response => {
        if (response.success && response.data) {
          response.data.forEach((question: any) => {
            questionsCache.value.set(question.id, question)
          })
        }
      })
      
      // Return all requested questions in order
      return questionIds.map(id => questionsCache.value.get(id)).filter(Boolean)
      
    } catch (err: any) {
      error.value = err.message || 'Failed to load questions'
      console.error('Question preload error:', err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Get a single question from cache or load it
  const getQuestion = async (questionId: string) => {
    if (questionsCache.value.has(questionId)) {
      return questionsCache.value.get(questionId)
    }
    
    const questions = await preloadQuestions([questionId])
    return questions[0] || null
  }
  
  // Clear cache (useful for memory management)
  const clearCache = () => {
    questionsCache.value.clear()
  }
  
  // Prefetch next N questions for smooth navigation
  const prefetchNext = async (currentIndex: number, questionIds: string[], prefetchCount = 3) => {
    const startIndex = currentIndex + 1
    const endIndex = Math.min(startIndex + prefetchCount, questionIds.length)
    
    if (startIndex < questionIds.length) {
      const idsToPreload = questionIds.slice(startIndex, endIndex)
      // Don't await - let it load in background
      preloadQuestions(idsToPreload).catch(console.error)
    }
  }
  
  return {
    loading: readonly(loading),
    error: readonly(error),
    preloadQuestions,
    getQuestion,
    clearCache,
    prefetchNext
  }
}