export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const session = await getUserSession(event)
    if (!session.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    const userId = session.user.id
    const userName = session.user.name || 'Student'
    
    // Mock performance data (in production, calculate from real data)
    const performance = {
      overall: {
        accuracy: 85.5,
        improvement: 12.3, // % improvement over last month
        studyTime: 156, // hours total
        questionsAnswered: 2847,
        testsCompleted: 34,
        perfectScores: 5
      },
      recent: {
        lastSessionAccuracy: 92,
        lastTestScore: 88,
        streakDays: 7,
        weeklyProgress: 78 // % of weekly goal
      },
      trends: {
        accuracyTrend: 'up', // up, down, stable
        speedTrend: 'up',
        consistencyTrend: 'stable'
      }
    }
    
    // Generate contextual messages based on performance
    const messages = []
    
    // Accuracy-based messages
    if (performance.recent.lastSessionAccuracy >= 90) {
      messages.push({
        id: 'high-accuracy',
        type: 'celebration',
        icon: 'solar:star-shine-bold-duotone',
        title: 'Outstanding Performance! 🌟',
        message: `${performance.recent.lastSessionAccuracy}% accuracy in your last session. You're mastering this material!`,
        color: 'success',
        priority: 'high'
      })
    } else if (performance.recent.lastSessionAccuracy >= 80) {
      messages.push({
        id: 'good-accuracy',
        type: 'encouragement',
        icon: 'solar:like-bold-duotone',
        title: 'Great Job! 👍',
        message: `${performance.recent.lastSessionAccuracy}% accuracy shows solid understanding. Keep pushing for that 90%!`,
        color: 'primary',
        priority: 'medium'
      })
    } else if (performance.recent.lastSessionAccuracy < 70) {
      messages.push({
        id: 'needs-improvement',
        type: 'motivation',
        icon: 'solar:target-bold-duotone',
        title: 'Room for Growth 💪',
        message: `Don't worry about the ${performance.recent.lastSessionAccuracy}% score. Every expert was once a beginner!`,
        color: 'warning',
        priority: 'high'
      })
    }
    
    // Streak-based messages
    if (performance.recent.streakDays >= 7) {
      messages.push({
        id: 'week-streak',
        type: 'milestone',
        icon: 'solar:flame-bold-duotone',
        title: `${performance.recent.streakDays} Day Streak! 🔥`,
        message: 'Your consistency is paying off. Studies show daily practice improves retention by 42%!',
        color: 'orange',
        priority: 'high'
      })
    } else if (performance.recent.streakDays === 6) {
      messages.push({
        id: 'almost-week',
        type: 'encouragement',
        icon: 'solar:calendar-mark-bold-duotone',
        title: 'One Day Away! 📅',
        message: 'Study today to reach a full week streak and unlock bonus XP!',
        color: 'info',
        priority: 'medium'
      })
    }
    
    // Improvement messages
    if (performance.overall.improvement > 10) {
      messages.push({
        id: 'significant-improvement',
        type: 'achievement',
        icon: 'solar:graph-up-bold-duotone',
        title: 'Incredible Progress! 📈',
        message: `You've improved by ${performance.overall.improvement}% this month. That's exceptional growth!`,
        color: 'success',
        priority: 'high'
      })
    }
    
    // Perfect score messages
    if (performance.overall.perfectScores > 0) {
      messages.push({
        id: 'perfect-scores',
        type: 'celebration',
        icon: 'solar:cup-star-bold-duotone',
        title: 'Perfection Achieved! 💯',
        message: `${performance.overall.perfectScores} perfect scores earned. You're becoming an expert!`,
        color: 'purple',
        priority: 'medium'
      })
    }
    
    // Study time messages
    const hoursThisWeek = 12 // Mock data
    if (hoursThisWeek > 10) {
      messages.push({
        id: 'dedicated-learner',
        type: 'recognition',
        icon: 'solar:clock-circle-bold-duotone',
        title: 'Dedicated Learner 🎓',
        message: `${hoursThisWeek} hours studied this week. Your dedication is inspiring!`,
        color: 'blue',
        priority: 'low'
      })
    }
    
    // Trend-based messages
    if (performance.trends.accuracyTrend === 'up' && performance.trends.speedTrend === 'up') {
      messages.push({
        id: 'double-improvement',
        type: 'insight',
        icon: 'solar:double-alt-arrow-up-bold-duotone',
        title: 'Double Win! 🚀',
        message: "You're getting both faster AND more accurate. That's the mark of true mastery!",
        color: 'success',
        priority: 'medium'
      })
    }
    
    // Weekly goal progress
    if (performance.recent.weeklyProgress >= 100) {
      messages.push({
        id: 'weekly-goal-achieved',
        type: 'milestone',
        icon: 'solar:verified-check-bold-duotone',
        title: 'Weekly Goal Crushed! 🎯',
        message: "You've exceeded your weekly study goal. Time to set a bigger challenge?",
        color: 'success',
        priority: 'medium'
      })
    } else if (performance.recent.weeklyProgress >= 80) {
      messages.push({
        id: 'weekly-goal-close',
        type: 'encouragement',
        icon: 'solar:hourglass-line-bold-duotone',
        title: 'Almost There! ⏳',
        message: `${performance.recent.weeklyProgress}% of your weekly goal completed. Finish strong!`,
        color: 'info',
        priority: 'low'
      })
    }
    
    // Personalized tips based on performance
    const tips = []
    
    if (performance.trends.speedTrend === 'down') {
      tips.push({
        id: 'speed-tip',
        icon: 'solar:lightbulb-bolt-bold-duotone',
        title: 'Speed Tip',
        message: 'Try the "Speed Practice" mode to improve your response time without sacrificing accuracy.'
      })
    }
    
    if (performance.overall.accuracy < 80) {
      tips.push({
        id: 'accuracy-tip',
        icon: 'solar:lightbulb-minimalistic-bold-duotone',
        title: 'Accuracy Tip',
        message: 'Review explanations for incorrect answers. Understanding "why" is key to improvement.'
      })
    }
    
    if (performance.recent.streakDays === 0) {
      tips.push({
        id: 'streak-tip',
        icon: 'solar:lightbulb-bold-duotone',
        title: 'Consistency Tip',
        message: 'Set a daily reminder to maintain your streak. Even 5 minutes counts!'
      })
    }
    
    // Sort messages by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    messages.sort((a, b) => 
      priorityOrder[a.priority as keyof typeof priorityOrder] - 
      priorityOrder[b.priority as keyof typeof priorityOrder]
    )
    
    return {
      success: true,
      data: {
        performance,
        messages: messages.slice(0, 5), // Max 5 messages
        tips,
        summary: {
          topStat: performance.recent.lastSessionAccuracy >= 90 ? 'accuracy' : 
                   performance.recent.streakDays >= 7 ? 'streak' : 
                   performance.overall.improvement > 10 ? 'improvement' : 'progress',
          motivationalQuote: getMotivationalQuote(performance)
        }
      }
    }
  } catch (error: any) {
    console.error('Performance insights fetch error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch performance insights'
    })
  }
})

// Helper function to get contextual motivational quotes
function getMotivationalQuote(performance: any): string {
  const quotes = {
    highPerformer: [
      "Excellence is not a destination but a continuous journey.",
      "Success is the sum of small efforts repeated day in and day out.",
      "You're not just passing exams, you're building expertise."
    ],
    improving: [
      "Every expert was once a disaster. Keep going!",
      "Progress, not perfection, is the goal.",
      "Your improvement shows your potential is limitless."
    ],
    consistent: [
      "Consistency is the mother of mastery.",
      "Small daily improvements lead to stunning results.",
      "Your dedication today shapes your success tomorrow."
    ],
    struggling: [
      "Difficult roads often lead to beautiful destinations.",
      "The master has failed more times than the beginner has tried.",
      "Every wrong answer is a step closer to understanding."
    ]
  }
  
  let category = 'improving'
  if (performance.overall.accuracy >= 85 && performance.recent.streakDays >= 7) {
    category = 'highPerformer'
  } else if (performance.recent.streakDays >= 5) {
    category = 'consistent'
  } else if (performance.overall.accuracy < 70) {
    category = 'struggling'
  }
  
  const categoryQuotes = quotes[category as keyof typeof quotes]
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)]
}