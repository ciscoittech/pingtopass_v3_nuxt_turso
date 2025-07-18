export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await requireAuth(event)
  
  // Mock leaderboard data
  const mockUsers = [
    { name: "Sarah Chen", xp: 15420, level: 12, tests: 45, streak: 23, accuracy: 92 },
    { name: "Michael Johnson", xp: 14890, level: 11, tests: 42, streak: 18, accuracy: 88 },
    { name: "Emma Davis", xp: 13200, level: 10, tests: 38, streak: 15, accuracy: 90 },
    { name: "James Wilson", xp: 11500, level: 9, tests: 35, streak: 12, accuracy: 85 },
    { name: "Lisa Thompson", xp: 10800, level: 8, tests: 32, streak: 10, accuracy: 87 },
  ]
  
  // Insert current user at random position if not in top 5
  const currentUserData = {
    name: user.name || "You",
    xp: 8500,
    level: 7,
    tests: 28,
    streak: 8,
    accuracy: 83,
    rank: 8
  }
  
  const leaderboard = mockUsers.map((u, index) => ({
    userId: `user-${index + 1}`,
    name: u.name,
    picture: null,
    totalXp: u.xp,
    level: u.level,
    rank: index + 1,
    testsCompleted: u.tests,
    avgScore: u.accuracy,
    studyStreak: u.streak,
    isCurrentUser: false
  }))
  
  return {
    success: true,
    data: {
      leaderboard,
      currentUser: {
        userId: user.id,
        totalXp: currentUserData.xp,
        level: currentUserData.level,
        rank: currentUserData.rank,
        testsCompleted: currentUserData.tests,
        avgScore: currentUserData.accuracy,
        progressToNext: 65 // 65% to next rank
      },
      timeframe: 'week'
    }
  }
})