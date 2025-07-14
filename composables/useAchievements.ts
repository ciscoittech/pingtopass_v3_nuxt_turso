interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: 'streak' | 'accuracy' | 'volume' | 'milestone' | 'special'
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const useAchievements = () => {
  const newAchievements = ref<Achievement[]>([])
  const showNotification = ref(false)
  const currentAchievement = ref<Achievement | null>(null)
  const achievementQueue = ref<Achievement[]>([])

  const checkForAchievements = async () => {
    try {
      const response = await $fetch('/api/achievements/check', {
        method: 'POST'
      })

      if (response.success && response.data.newAchievements.length > 0) {
        // Add new achievements to queue
        achievementQueue.value.push(...response.data.newAchievements)
        
        // Start showing notifications if not already showing
        if (!showNotification.value) {
          showNextAchievement()
        }
      }

      return response.data
    } catch (error) {
      console.error('Failed to check achievements:', error)
      return { newAchievements: [], totalPoints: 0 }
    }
  }

  const showNextAchievement = () => {
    if (achievementQueue.value.length > 0) {
      currentAchievement.value = achievementQueue.value.shift()!
      showNotification.value = true
    }
  }

  const closeNotification = () => {
    showNotification.value = false
    currentAchievement.value = null
    
    // Show next achievement after a short delay
    setTimeout(() => {
      if (achievementQueue.value.length > 0) {
        showNextAchievement()
      }
    }, 500)
  }

  const triggerAchievementCheck = () => {
    // Check achievements after a short delay to allow progress updates
    setTimeout(checkForAchievements, 1000)
  }

  return {
    newAchievements,
    showNotification,
    currentAchievement,
    checkForAchievements,
    closeNotification,
    triggerAchievementCheck
  }
}