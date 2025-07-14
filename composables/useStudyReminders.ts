interface StudyReminder {
  id: string
  title: string
  message: string
  type: 'streak' | 'goal' | 'weak_area' | 'motivation'
  priority: 'low' | 'medium' | 'high'
  action?: {
    text: string
    route?: string
    callback?: () => void
  }
}

export const useStudyReminders = () => {
  const reminders = ref<StudyReminder[]>([])
  const showReminder = ref(false)
  const currentReminder = ref<StudyReminder | null>(null)

  const generateReminders = (progressData: any) => {
    const newReminders: StudyReminder[] = []
    const now = new Date()
    const currentHour = now.getHours()
    
    if (!progressData) return newReminders

    // Streak-based reminders
    const currentStreak = progressData.streaks?.currentDaily || 0
    const lastStudyTime = progressData.lastStudyTime || 0
    const timeSinceLastStudy = Math.floor(Date.now() / 1000) - lastStudyTime
    const hoursSinceStudy = timeSinceLastStudy / 3600

    // Risk of losing streak
    if (currentStreak > 0 && hoursSinceStudy > 20) {
      newReminders.push({
        id: 'streak_risk',
        title: 'Streak at Risk! ⚠️',
        message: `Don't lose your ${currentStreak}-day streak! Study today to keep it going.`,
        type: 'streak',
        priority: 'high',
        action: {
          text: 'Study Now',
          route: '/study'
        }
      })
    }

    // Daily goal reminders
    const weeklyProgress = progressData.weeklyProgress
    if (weeklyProgress && weeklyProgress.percentage < 70 && currentHour >= 18) {
      const remaining = Math.max(0, (weeklyProgress.goal || 0) - (weeklyProgress.current || 0))
      if (remaining > 0) {
        newReminders.push({
          id: 'weekly_goal',
          title: 'Weekly Goal Check-in',
          message: `You need ${Math.round(remaining)} more minutes this week to reach your goal.`,
          type: 'goal',
          priority: 'medium',
          action: {
            text: 'Study Now',
            route: '/study'
          }
        })
      }
    }

    // Low accuracy reminder
    if ((progressData.currentAccuracy || 0) < 70) {
      newReminders.push({
        id: 'accuracy_focus',
        title: 'Focus on Accuracy',
        message: 'Your accuracy could use some improvement. Try reviewing incorrect answers.',
        type: 'weak_area',
        priority: 'medium',
        action: {
          text: 'Review Mistakes',
          route: '/progress'
        }
      })
    }

    // Motivational reminders for consistent studiers
    if (currentStreak >= 7 && hoursSinceStudy > 12 && hoursSinceStudy < 20) {
      newReminders.push({
        id: 'motivation',
        title: 'Keep the Momentum! 🚀',
        message: `You're on a ${currentStreak}-day streak! A quick study session will keep you on track.`,
        type: 'motivation',
        priority: 'low',
        action: {
          text: 'Quick Study',
          route: '/study'
        }
      })
    }

    // Time-based reminders
    if (currentHour === 9 && hoursSinceStudy > 16) {
      newReminders.push({
        id: 'morning_reminder',
        title: 'Good Morning! ☀️',
        message: 'Start your day with some learning. Morning study sessions are highly effective!',
        type: 'motivation',
        priority: 'low',
        action: {
          text: 'Start Learning',
          route: '/study'
        }
      })
    }

    // Weekend reminders
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    if (isWeekend && hoursSinceStudy > 24) {
      newReminders.push({
        id: 'weekend_reminder',
        title: 'Weekend Learning',
        message: 'Weekends are perfect for deepening your knowledge. Spend some time studying!',
        type: 'motivation',
        priority: 'low',
        action: {
          text: 'Study This Weekend',
          route: '/study'
        }
      })
    }

    return newReminders
  }

  const checkReminders = async () => {
    try {
      // Get user progress data
      const progressResponse = await $fetch('/api/progress')
      if (progressResponse.success) {
        const newReminders = generateReminders(progressResponse.data)
        
        // Filter out reminders we've already shown recently
        const filteredReminders = filterRecentReminders(newReminders)
        
        if (filteredReminders.length > 0) {
          reminders.value = filteredReminders
          showNextReminder()
        }
      }
    } catch (error) {
      console.error('Failed to check reminders:', error)
    }
  }

  const filterRecentReminders = (newReminders: StudyReminder[]) => {
    // Get shown reminders from localStorage
    const shownReminders = JSON.parse(localStorage.getItem('shownReminders') || '{}')
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    return newReminders.filter(reminder => {
      const lastShown = shownReminders[reminder.id]
      if (!lastShown) return true
      
      // Show high priority reminders every 6 hours
      if (reminder.priority === 'high') {
        return now - lastShown > (6 * 60 * 60 * 1000)
      }
      
      // Show medium priority reminders once per day
      if (reminder.priority === 'medium') {
        return now - lastShown > oneDay
      }
      
      // Show low priority reminders every 2 days
      return now - lastShown > (2 * oneDay)
    })
  }

  const showNextReminder = () => {
    if (reminders.value.length > 0 && !showReminder.value) {
      // Show highest priority reminder first
      const sortedReminders = reminders.value.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      
      currentReminder.value = sortedReminders[0]
      showReminder.value = true
      
      // Mark as shown
      markReminderAsShown(currentReminder.value.id)
    }
  }

  const markReminderAsShown = (reminderId: string) => {
    const shownReminders = JSON.parse(localStorage.getItem('shownReminders') || '{}')
    shownReminders[reminderId] = Date.now()
    localStorage.setItem('shownReminders', JSON.stringify(shownReminders))
  }

  const dismissReminder = () => {
    showReminder.value = false
    currentReminder.value = null
    
    // Remove from queue
    if (reminders.value.length > 0) {
      reminders.value = reminders.value.slice(1)
    }
    
    // Show next reminder after delay
    setTimeout(() => {
      if (reminders.value.length > 0) {
        showNextReminder()
      }
    }, 2000)
  }

  const executeReminderAction = () => {
    if (currentReminder.value?.action) {
      if (currentReminder.value.action.route) {
        navigateTo(currentReminder.value.action.route)
      } else if (currentReminder.value.action.callback) {
        currentReminder.value.action.callback()
      }
    }
    dismissReminder()
  }

  // Auto-check reminders periodically
  const startReminderSystem = () => {
    // Check immediately
    checkReminders()
    
    // Check every 30 minutes
    setInterval(checkReminders, 30 * 60 * 1000)
  }

  return {
    reminders,
    showReminder,
    currentReminder,
    checkReminders,
    dismissReminder,
    executeReminderAction,
    startReminderSystem
  }
}