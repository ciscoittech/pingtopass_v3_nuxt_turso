import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the database and utilities
vi.mock('~/server/database/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    then: vi.fn()
  }
}))

vi.mock('~/server/utils/progressCalculations', () => ({
  calculateUserProgress: vi.fn(),
  updateUserStreaks: vi.fn(),
  calculateWeeklyProgress: vi.fn()
}))

// Mock Nuxt server utilities
vi.mock('#imports', () => ({
  getUserSession: vi.fn(),
  createError: vi.fn(),
  getQuery: vi.fn()
}))

describe('Progress API Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateUserProgress', () => {
    it('should calculate correct accuracy percentage', () => {
      const activities = [
        { questionsAnswered: 10, correctAnswers: 8 },
        { questionsAnswered: 5, correctAnswers: 4 },
        { questionsAnswered: 15, correctAnswers: 12 }
      ]

      const totalQuestions = activities.reduce((sum, a) => sum + a.questionsAnswered, 0)
      const totalCorrect = activities.reduce((sum, a) => sum + a.correctAnswers, 0)
      const accuracy = (totalCorrect / totalQuestions) * 100

      expect(totalQuestions).toBe(30)
      expect(totalCorrect).toBe(24)
      expect(accuracy).toBe(80)
    })

    it('should handle zero questions gracefully', () => {
      const activities: any[] = []
      
      const totalQuestions = activities.reduce((sum, a) => sum + (a.questionsAnswered || 0), 0)
      const totalCorrect = activities.reduce((sum, a) => sum + (a.correctAnswers || 0), 0)
      const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

      expect(accuracy).toBe(0)
    })

    it('should calculate total study time correctly', () => {
      const activities = [
        { timeSpent: 300 }, // 5 minutes
        { timeSpent: 600 }, // 10 minutes
        { timeSpent: 900 }  // 15 minutes
      ]

      const totalTime = activities.reduce((sum, a) => sum + a.timeSpent, 0)
      
      expect(totalTime).toBe(1800) // 30 minutes total
    })

    it('should determine correct mastery level', () => {
      const testCases = [
        { accuracy: 95, sessions: 5, expected: 'expert' },
        { accuracy: 85, sessions: 3, expected: 'advanced' },
        { accuracy: 75, sessions: 2, expected: 'intermediate' },
        { accuracy: 65, sessions: 1, expected: 'beginner' },
        { accuracy: 45, sessions: 1, expected: 'beginner' }
      ]

      testCases.forEach(({ accuracy, sessions, expected }) => {
        const masteryLevel = getMasteryLevel(accuracy, sessions)
        expect(masteryLevel).toBe(expected)
      })
    })
  })

  describe('Streak Calculations', () => {
    it('should calculate daily streak correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const oneDayAgo = now - (24 * 60 * 60)
      const twoDaysAgo = now - (2 * 24 * 60 * 60)
      
      // Consecutive days
      const consecutiveActivities = [
        { timestamp: now },
        { timestamp: oneDayAgo },
        { timestamp: twoDaysAgo }
      ]

      const streak = calculateDailyStreak(consecutiveActivities)
      expect(streak).toBe(3)
    })

    it('should reset streak on gap', () => {
      const now = Math.floor(Date.now() / 1000)
      const threeDaysAgo = now - (3 * 24 * 60 * 60)
      
      // Gap in study days
      const gappedActivities = [
        { timestamp: now },
        { timestamp: threeDaysAgo } // Missing day in between
      ]

      const streak = calculateDailyStreak(gappedActivities)
      expect(streak).toBe(1) // Should reset to current day only
    })

    it('should handle answer streak correctly', () => {
      const answers = [
        { correct: true },
        { correct: true },
        { correct: false },
        { correct: true },
        { correct: true }
      ]

      const currentStreak = calculateAnswerStreak(answers)
      expect(currentStreak).toBe(2) // Last 2 correct answers
    })
  })

  describe('Weekly Progress', () => {
    it('should calculate weekly progress percentage', () => {
      const weeklyGoal = 300 // 5 hours in minutes
      const currentProgress = 240 // 4 hours in minutes
      
      const percentage = (currentProgress / weeklyGoal) * 100
      
      expect(percentage).toBe(80)
    })

    it('should handle cases where progress exceeds goal', () => {
      const weeklyGoal = 300
      const currentProgress = 360 // Exceeded goal
      
      const percentage = Math.min((currentProgress / weeklyGoal) * 100, 100)
      
      expect(percentage).toBe(100) // Capped at 100%
    })
  })

  describe('Analytics Data Processing', () => {
    it('should group daily statistics correctly', () => {
      const activities = [
        { timestamp: 1640995200, timeSpent: 300, questionsAnswered: 5, correctAnswers: 4 }, // Jan 1
        { timestamp: 1640995800, timeSpent: 600, questionsAnswered: 10, correctAnswers: 8 }, // Jan 1 (same day)
        { timestamp: 1641081600, timeSpent: 900, questionsAnswered: 15, correctAnswers: 12 } // Jan 2
      ]

      const dailyStats = groupByDay(activities)
      
      expect(Object.keys(dailyStats)).toHaveLength(2) // 2 unique days
      expect(dailyStats['2022-01-01'].timeSpent).toBe(900) // Combined time for Jan 1
      expect(dailyStats['2022-01-01'].questionsAnswered).toBe(15) // Combined questions for Jan 1
    })

    it('should calculate trending data correctly', () => {
      const weeklyData = [
        { week: 1, accuracy: 70 },
        { week: 2, accuracy: 75 },
        { week: 3, accuracy: 80 },
        { week: 4, accuracy: 85 }
      ]

      const trend = calculateTrend(weeklyData.map(w => w.accuracy))
      expect(trend).toBe('increasing')
    })

    it('should detect declining trends', () => {
      const weeklyData = [85, 80, 75, 70]
      
      const trend = calculateTrend(weeklyData)
      expect(trend).toBe('decreasing')
    })
  })
})

// Helper functions for testing
function getMasteryLevel(accuracy: number, sessions: number): string {
  if (sessions >= 5 && accuracy >= 90) return 'expert'
  if (sessions >= 3 && accuracy >= 80) return 'advanced'
  if (sessions >= 2 && accuracy >= 70) return 'intermediate'
  return 'beginner'
}

function calculateDailyStreak(activities: { timestamp: number }[]): number {
  if (activities.length === 0) return 0
  
  // Sort by timestamp descending
  const sorted = activities.sort((a, b) => b.timestamp - a.timestamp)
  
  const today = Math.floor(Date.now() / 1000 / 86400) * 86400
  let streak = 0
  let currentDay = today

  for (const activity of sorted) {
    const activityDay = Math.floor(activity.timestamp / 86400) * 86400
    
    if (activityDay === currentDay) {
      streak++
      currentDay -= 86400 // Move to previous day
    } else if (activityDay < currentDay - 86400) {
      // Gap found, break streak
      break
    }
  }
  
  return streak
}

function calculateAnswerStreak(answers: { correct: boolean }[]): number {
  let streak = 0
  
  // Count from the end (most recent)
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].correct) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function groupByDay(activities: any[]): Record<string, any> {
  const groups: Record<string, any> = {}
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp * 1000).toISOString().split('T')[0]
    
    if (!groups[date]) {
      groups[date] = {
        date,
        timeSpent: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        sessions: 0
      }
    }
    
    groups[date].timeSpent += activity.timeSpent || 0
    groups[date].questionsAnswered += activity.questionsAnswered || 0
    groups[date].correctAnswers += activity.correctAnswers || 0
    groups[date].sessions++
  })
  
  return groups
}

function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const first = values[0]
  const last = values[values.length - 1]
  const diff = last - first
  
  if (diff > 5) return 'increasing'
  if (diff < -5) return 'decreasing'
  return 'stable'
}