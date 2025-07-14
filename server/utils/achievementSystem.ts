export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: 'streak' | 'accuracy' | 'volume' | 'milestone' | 'special'
  condition: (stats: any) => boolean
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const achievements: Achievement[] = [
  // Streak Achievements
  {
    id: 'first_day',
    title: 'First Steps',
    description: 'Complete your first day of studying',
    icon: 'mdi-foot-print',
    type: 'streak',
    condition: (stats) => (stats.streaks?.currentDaily || 0) >= 1,
    points: 10,
    rarity: 'common'
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    icon: 'mdi-sword',
    type: 'streak',
    condition: (stats) => (stats.streaks?.currentDaily || 0) >= 7,
    points: 50,
    rarity: 'rare'
  },
  {
    id: 'study_streak_30',
    title: 'Dedication Master',
    description: 'Maintain a 30-day study streak',
    icon: 'mdi-fire',
    type: 'streak',
    condition: (stats) => (stats.streaks?.currentDaily || 0) >= 30,
    points: 200,
    rarity: 'epic'
  },
  {
    id: 'streak_legend',
    title: 'Streak Legend',
    description: 'Achieve a 100-day study streak',
    icon: 'mdi-crown',
    type: 'streak',
    condition: (stats) => (stats.streaks?.currentDaily || 0) >= 100,
    points: 1000,
    rarity: 'legendary'
  },

  // Accuracy Achievements
  {
    id: 'accuracy_70',
    title: 'Getting Good',
    description: 'Achieve 70% overall accuracy',
    icon: 'mdi-target-account',
    type: 'accuracy',
    condition: (stats) => (stats.currentAccuracy || 0) >= 70,
    points: 25,
    rarity: 'common'
  },
  {
    id: 'accuracy_85',
    title: 'Sharp Shooter',
    description: 'Achieve 85% overall accuracy',
    icon: 'mdi-target',
    type: 'accuracy',
    condition: (stats) => (stats.currentAccuracy || 0) >= 85,
    points: 75,
    rarity: 'rare'
  },
  {
    id: 'accuracy_95',
    title: 'Precision Master',
    description: 'Achieve 95% overall accuracy',
    icon: 'mdi-bullseye-arrow',
    type: 'accuracy',
    condition: (stats) => (stats.currentAccuracy || 0) >= 95,
    points: 150,
    rarity: 'epic'
  },
  {
    id: 'perfect_streak_10',
    title: 'Perfect Ten',
    description: 'Answer 10 questions correctly in a row',
    icon: 'mdi-check-all',
    type: 'accuracy',
    condition: (stats) => (stats.streaks?.currentAnswer || 0) >= 10,
    points: 30,
    rarity: 'common'
  },
  {
    id: 'perfect_streak_50',
    title: 'Flawless',
    description: 'Answer 50 questions correctly in a row',
    icon: 'mdi-diamond-stone',
    type: 'accuracy',
    condition: (stats) => (stats.streaks?.currentAnswer || 0) >= 50,
    points: 100,
    rarity: 'rare'
  },

  // Volume Achievements
  {
    id: 'questions_100',
    title: 'Century Mark',
    description: 'Answer 100 questions',
    icon: 'mdi-numeric-100-box',
    type: 'volume',
    condition: (stats) => (stats.totalQuestions || 0) >= 100,
    points: 20,
    rarity: 'common'
  },
  {
    id: 'questions_1000',
    title: 'Question Master',
    description: 'Answer 1,000 questions',
    icon: 'mdi-numeric-1-box-multiple',
    type: 'volume',
    condition: (stats) => (stats.totalQuestions || 0) >= 1000,
    points: 100,
    rarity: 'rare'
  },
  {
    id: 'questions_5000',
    title: 'Knowledge Seeker',
    description: 'Answer 5,000 questions',
    icon: 'mdi-book-multiple',
    type: 'volume',
    condition: (stats) => (stats.totalQuestions || 0) >= 5000,
    points: 300,
    rarity: 'epic'
  },
  {
    id: 'study_time_10h',
    title: 'Time Investor',
    description: 'Study for 10 hours total',
    icon: 'mdi-clock',
    type: 'volume',
    condition: (stats) => (stats.totalStudyTime || 0) >= 36000, // 10 hours in seconds
    points: 50,
    rarity: 'common'
  },
  {
    id: 'study_time_100h',
    title: 'Dedicated Scholar',
    description: 'Study for 100 hours total',
    icon: 'mdi-clock-star-four-points',
    type: 'volume',
    condition: (stats) => (stats.totalStudyTime || 0) >= 360000, // 100 hours
    points: 200,
    rarity: 'rare'
  },

  // Milestone Achievements
  {
    id: 'first_test',
    title: 'Test Taker',
    description: 'Complete your first practice test',
    icon: 'mdi-clipboard-check',
    type: 'milestone',
    condition: (stats) => (stats.testsCompleted || 0) >= 1,
    points: 25,
    rarity: 'common'
  },
  {
    id: 'test_ace',
    title: 'Test Ace',
    description: 'Score 90% or higher on a practice test',
    icon: 'mdi-medal',
    type: 'milestone',
    condition: (stats) => (stats.bestTestScore || 0) >= 90,
    points: 75,
    rarity: 'rare'
  },
  {
    id: 'exam_mastery',
    title: 'Exam Master',
    description: 'Achieve mastery level in an exam',
    icon: 'mdi-school',
    type: 'milestone',
    condition: (stats) => stats.masteryLevel === 'expert',
    points: 150,
    rarity: 'epic'
  },

  // Special Achievements
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Study before 8 AM',
    icon: 'mdi-weather-sunrise',
    type: 'special',
    condition: (stats) => stats.hasEarlyMorningStudy || false,
    points: 15,
    rarity: 'common'
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Study after 10 PM',
    icon: 'mdi-owl',
    type: 'special',
    condition: (stats) => stats.hasLateNightStudy || false,
    points: 15,
    rarity: 'common'
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Study on both Saturday and Sunday',
    icon: 'mdi-calendar-weekend',
    type: 'special',
    condition: (stats) => stats.hasWeekendStudy || false,
    points: 20,
    rarity: 'common'
  }
]

export function checkAchievements(userStats: any, previousAchievements: string[] = []): Achievement[] {
  const newAchievements: Achievement[] = []
  
  for (const achievement of achievements) {
    // Skip if user already has this achievement
    if (previousAchievements.includes(achievement.id)) {
      continue
    }
    
    // Check if condition is met
    if (achievement.condition(userStats)) {
      newAchievements.push(achievement)
    }
  }
  
  return newAchievements
}

export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common': return 'grey'
    case 'rare': return 'blue'
    case 'epic': return 'purple'
    case 'legendary': return 'orange'
    default: return 'grey'
  }
}

export function calculateTotalPoints(achievementIds: string[]): number {
  return achievements
    .filter(achievement => achievementIds.includes(achievement.id))
    .reduce((total, achievement) => total + achievement.points, 0)
}