import { useDB } from '~/server/utils/db'
import { 
  userProgress, 
  userStreaks, 
  studyActivity, 
  testSessions, 
  studySessions,
  exams 
} from '~/server/database/schema'
import { eq, desc, gte, lte, and, sum, avg, count } from 'drizzle-orm'

export interface ProgressMetrics {
  overall: {
    totalStudyTime: number
    totalSessions: number
    totalTests: number
    averageAccuracy: number
    currentStreak: number
    masteryLevel: string
  }
  streaks: {
    currentDaily: number
    longestDaily: number
    currentAnswer: number
    longestAnswer: number
    perfectScores: number
  }
  weakAreas: string[]
  strongAreas: string[]
  recentActivity: any[]
  weeklyProgress: {
    goal: number
    current: number
    percentage: number
  }
  examProgress: Record<string, any>
}

export class ProgressCalculator {
  private userId: string
  private db: ReturnType<typeof useDB>

  constructor(userId: string) {
    this.userId = userId
    this.db = useDB()
  }

  async calculateOverallProgress(): Promise<ProgressMetrics> {
    // Get or create user progress record
    const progress = await this.getOrCreateUserProgress()
    const streaks = await this.getOrCreateUserStreaks()
    
    // Calculate exam-specific progress
    const examProgress = await this.calculateExamProgress()
    
    // Get recent activity
    const recentActivity = await this.getRecentActivity(30) // last 30 days
    
    // Calculate weak and strong areas
    const { weakAreas, strongAreas } = await this.analyzePerformanceAreas()
    
    return {
      overall: {
        totalStudyTime: progress.totalTimeSpent || 0,
        totalSessions: progress.totalStudySessions || 0,
        totalTests: progress.totalTestsTaken || 0,
        averageAccuracy: progress.currentAccuracy || 0,
        currentStreak: streaks.currentAnswerStreak || 0,
        masteryLevel: progress.masteryLevel || 'beginner'
      },
      streaks: {
        currentDaily: streaks.currentDailyStreak || 0,
        longestDaily: streaks.longestDailyStreak || 0,
        currentAnswer: streaks.currentAnswerStreak || 0,
        longestAnswer: streaks.longestAnswerStreak || 0,
        perfectScores: streaks.perfectScoreStreak || 0
      },
      weakAreas,
      strongAreas,
      recentActivity,
      weeklyProgress: {
        goal: progress.weeklyGoal || 0,
        current: progress.weeklyProgress || 0,
        percentage: progress.weeklyGoal > 0 ? (progress.weeklyProgress / progress.weeklyGoal) * 100 : 0
      },
      examProgress
    }
  }

  async updateProgressAfterStudySession(sessionData: {
    examId: string
    questionsAnswered: number
    correctAnswers: number
    timeSpent: number
    sessionId: string
  }) {
    const { examId, questionsAnswered, correctAnswers, timeSpent, sessionId } = sessionData
    
    // Update overall progress
    await this.updateUserProgress(examId, {
      totalStudySessions: 1,
      totalQuestionsAnswered: questionsAnswered,
      correctAnswers,
      incorrectAnswers: questionsAnswered - correctAnswers,
      totalTimeSpent: timeSpent
    })
    
    // Update streaks
    await this.updateStreaks(correctAnswers > 0)
    
    // Record activity
    await this.recordActivity({
      activityType: 'study_session',
      examId,
      questionsAnswered,
      correctAnswers,
      timeSpent,
      sessionId
    })
  }

  async updateProgressAfterTest(testData: {
    examId: string
    totalQuestions: number
    correctAnswers: number
    score: number
    timeSpent: number
    sessionId: string
    isPerfectScore: boolean
  }) {
    const { examId, totalQuestions, correctAnswers, score, timeSpent, sessionId, isPerfectScore } = testData
    
    // Update overall progress
    await this.updateUserProgress(examId, {
      totalTestsTaken: 1,
      totalQuestionsAnswered: totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      totalTimeSpent: timeSpent,
      lastTestScore: score
    })
    
    // Update streaks
    await this.updateStreaks(correctAnswers > 0, isPerfectScore)
    
    // Record activity
    await this.recordActivity({
      activityType: 'test_completed',
      examId,
      questionsAnswered: totalQuestions,
      correctAnswers,
      timeSpent,
      score,
      sessionId
    })
  }

  private async getOrCreateUserProgress() {
    let progress = await this.db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, this.userId))
      .get()

    if (!progress) {
      // Create initial progress record
      const timestamp = Math.floor(Date.now() / 1000)
      
      // First, get any exam ID to use as default (or create without exam_id)
      const firstExam = await this.db
        .select({ id: exams.id })
        .from(exams)
        .limit(1)
        .get()
      
      const progressData = {
        id: `prog_${this.userId}_overall`,
        userId: this.userId,
        examId: firstExam?.id || 'exam_default', // Use first exam or default
        firstStudyDate: timestamp,
        lastUpdated: timestamp,
        createdAt: timestamp
      }
      
      await this.db.insert(userProgress).values(progressData)
      progress = progressData
    }

    return progress
  }

  private async getOrCreateUserStreaks() {
    let streaks = await this.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, this.userId))
      .get()

    if (!streaks) {
      const timestamp = Math.floor(Date.now() / 1000)
      const streakData = {
        id: `streak_${this.userId}`,
        userId: this.userId,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      
      await this.db.insert(userStreaks).values(streakData)
      streaks = streakData
    }

    return streaks
  }

  private async updateUserProgress(examId: string, updates: {
    totalStudySessions?: number
    totalTestsTaken?: number
    totalQuestionsAnswered?: number
    correctAnswers?: number
    incorrectAnswers?: number
    totalTimeSpent?: number
    lastTestScore?: number
  }) {
    const timestamp = Math.floor(Date.now() / 1000)
    
    // Get current progress
    const current = await this.getOrCreateUserProgress()
    
    // Calculate new values
    const newValues = {
      totalStudySessions: (current.totalStudySessions || 0) + (updates.totalStudySessions || 0),
      totalTestsTaken: (current.totalTestsTaken || 0) + (updates.totalTestsTaken || 0),
      totalQuestionsAnswered: (current.totalQuestionsAnswered || 0) + (updates.totalQuestionsAnswered || 0),
      correctAnswers: (current.correctAnswers || 0) + (updates.correctAnswers || 0),
      incorrectAnswers: (current.incorrectAnswers || 0) + (updates.incorrectAnswers || 0),
      totalTimeSpent: (current.totalTimeSpent || 0) + (updates.totalTimeSpent || 0),
      lastUpdated: timestamp
    }
    
    // Calculate accuracy
    const totalAnswered = newValues.correctAnswers + newValues.incorrectAnswers
    newValues.currentAccuracy = totalAnswered > 0 ? (newValues.correctAnswers / totalAnswered) * 100 : 0
    
    // Update best test score if applicable
    if (updates.lastTestScore !== undefined) {
      newValues.bestTestScore = Math.max(current.bestTestScore || 0, updates.lastTestScore)
    }
    
    await this.db
      .update(userProgress)
      .set(newValues)
      .where(eq(userProgress.userId, this.userId))
  }

  private async updateStreaks(isCorrect: boolean, isPerfectScore = false) {
    const timestamp = Math.floor(Date.now() / 1000)
    const today = Math.floor(timestamp / 86400) * 86400 // start of day
    
    const streaks = await this.getOrCreateUserStreaks()
    
    const updates: any = {
      updatedAt: timestamp
    }
    
    // Update answer streak
    if (isCorrect) {
      updates.currentAnswerStreak = (streaks.currentAnswerStreak || 0) + 1
      updates.longestAnswerStreak = Math.max(
        streaks.longestAnswerStreak || 0, 
        updates.currentAnswerStreak
      )
      updates.lastCorrectAnswer = timestamp
    } else {
      updates.currentAnswerStreak = 0
    }
    
    // Update daily study streak
    const lastStudyDay = streaks.lastStudyDate ? Math.floor(streaks.lastStudyDate / 86400) * 86400 : 0
    const todayStart = today
    
    if (lastStudyDay === todayStart - 86400) {
      // Studied yesterday, continue streak
      updates.currentDailyStreak = (streaks.currentDailyStreak || 0) + 1
    } else if (lastStudyDay === todayStart) {
      // Already studied today, no change to streak
      updates.currentDailyStreak = streaks.currentDailyStreak || 1
    } else {
      // Gap in studying, reset streak
      updates.currentDailyStreak = 1
    }
    
    updates.longestDailyStreak = Math.max(
      streaks.longestDailyStreak || 0,
      updates.currentDailyStreak
    )
    updates.lastStudyDate = timestamp
    
    // Update perfect score streak
    if (isPerfectScore) {
      updates.perfectScoreStreak = (streaks.perfectScoreStreak || 0) + 1
      updates.longestPerfectStreak = Math.max(
        streaks.longestPerfectStreak || 0,
        updates.perfectScoreStreak
      )
    } else if (updates.lastTestScore !== undefined) {
      // Only reset if this was a test (not study session)
      updates.perfectScoreStreak = 0
    }
    
    await this.db
      .update(userStreaks)
      .set(updates)
      .where(eq(userStreaks.userId, this.userId))
  }

  private async recordActivity(activity: {
    activityType: string
    examId?: string
    questionsAnswered: number
    correctAnswers: number
    timeSpent: number
    score?: number
    sessionId: string
  }) {
    const timestamp = Math.floor(Date.now() / 1000)
    const date = Math.floor(timestamp / 86400) * 86400 // start of day
    
    await this.db.insert(studyActivity).values({
      id: `activity_${timestamp}_${this.userId}`,
      userId: this.userId,
      examId: activity.examId,
      activityType: activity.activityType,
      activityData: JSON.stringify({
        sessionId: activity.sessionId,
        performance: {
          accuracy: (activity.correctAnswers / activity.questionsAnswered) * 100,
          score: activity.score
        }
      }),
      questionsAnswered: activity.questionsAnswered,
      correctAnswers: activity.correctAnswers,
      timeSpent: activity.timeSpent,
      score: activity.score,
      sessionId: activity.sessionId,
      date,
      timestamp,
      createdAt: timestamp
    })
  }

  private async getRecentActivity(days: number) {
    const startDate = Math.floor(Date.now() / 1000) - (days * 86400)
    
    return await this.db
      .select()
      .from(studyActivity)
      .where(
        and(
          eq(studyActivity.userId, this.userId),
          gte(studyActivity.timestamp, startDate)
        )
      )
      .orderBy(desc(studyActivity.timestamp))
      .limit(50)
  }

  private async calculateExamProgress() {
    // This would analyze performance per exam
    // For now, return empty object - can be expanded later
    return {}
  }

  private async analyzePerformanceAreas() {
    // This would analyze question topics/objectives to find weak areas
    // For now, return empty arrays - can be expanded with ML algorithms later
    return {
      weakAreas: [],
      strongAreas: []
    }
  }
}

// Utility functions for external use
export async function getUserProgressMetrics(userId: string): Promise<ProgressMetrics> {
  const calculator = new ProgressCalculator(userId)
  return await calculator.calculateOverallProgress()
}

export async function updateProgressAfterStudy(userId: string, sessionData: any) {
  const calculator = new ProgressCalculator(userId)
  return await calculator.updateProgressAfterStudySession(sessionData)
}

export async function updateProgressAfterTest(userId: string, testData: any) {
  const calculator = new ProgressCalculator(userId)
  return await calculator.updateProgressAfterTest(testData)
}