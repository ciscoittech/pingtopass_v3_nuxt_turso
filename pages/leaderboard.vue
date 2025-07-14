<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// State management
const selectedCategory = ref('points')
const selectedTimeframe = ref('all_time')
const loading = ref(false)

// Get current user
const { data: userData } = await useFetch('/api/auth/me')
const currentUser = computed(() => userData.value?.user)

// Fetch leaderboard data
const { data: leaderboardData, pending: leaderboardLoading, refresh: refreshLeaderboard } = await useFetch('/api/leaderboard/global', {
  query: computed(() => ({
    category: selectedCategory.value,
    timeframe: selectedTimeframe.value,
    limit: 50
  })),
  server: false
})

const leaderboard = computed(() => leaderboardData.value?.data)

// Watch for category/timeframe changes
watch([selectedCategory, selectedTimeframe], () => {
  refreshLeaderboard()
})

// Available categories and timeframes
const categories = [
  { title: 'Total Points', value: 'points', icon: 'mdi-star', description: 'Points earned from studying and achievements' },
  { title: 'Accuracy', value: 'accuracy', icon: 'mdi-target', description: 'Overall question accuracy (min. 50 questions)' },
  { title: 'Study Streak', value: 'streak', icon: 'mdi-fire', description: 'Current daily study streak' },
  { title: 'Questions Answered', value: 'questions', icon: 'mdi-help-circle', description: 'Total number of questions answered' },
  { title: 'Study Time', value: 'study_time', icon: 'mdi-clock', description: 'Total time spent studying' }
]

const timeframes = [
  { title: 'All Time', value: 'all_time' },
  { title: 'This Year', value: 'year' },
  { title: 'This Quarter', value: 'quarter' },
  { title: 'This Month', value: 'month' },
  { title: 'This Week', value: 'week' }
]

// Helper functions
const formatScore = (score: number, category: string) => {
  switch (category) {
    case 'points':
      return new Intl.NumberFormat().format(Math.round(score))
    case 'accuracy':
      return `${Math.round(score * 10) / 10}%`
    case 'streak':
      return `${Math.round(score)} days`
    case 'questions':
      return new Intl.NumberFormat().format(Math.round(score))
    case 'study_time':
      return formatTime(score)
    default:
      return score.toString()
  }
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return 'amber'
    case 2: return 'grey'
    case 3: return 'orange'
    default: return 'primary'
  }
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return 'mdi-trophy'
    case 2: return 'mdi-medal'
    case 3: return 'mdi-medal'
    default: return 'mdi-numeric-' + Math.min(rank, 9) + '-circle'
  }
}

const isCurrentUser = (userId: string) => {
  return currentUser.value?.id === userId
}

const getCurrentUserRank = () => {
  if (!leaderboard.value?.entries || !currentUser.value) return null
  
  const userEntry = leaderboard.value.entries.find((entry: any) => entry.userId === currentUser.value.id)
  return userEntry?.rank || null
}
</script>

<template>
  <div class="leaderboard-page">
    <v-container>
      <!-- Header -->
      <div class="page-header mb-6">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon class="mr-2" color="primary">mdi-trophy</v-icon>
              Leaderboard
            </h1>
            <p class="text-body-1 text-grey-darken-1">
              See how you stack up against other learners
            </p>
          </div>
          
          <v-chip
            v-if="getCurrentUserRank()"
            color="primary"
            variant="elevated"
            size="large"
          >
            <v-icon start>mdi-account</v-icon>
            Your Rank: #{{ getCurrentUserRank() }}
          </v-chip>
        </div>
      </div>

      <!-- Filters -->
      <v-card class="mb-6" elevation="2">
        <v-card-text class="pa-4">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedCategory"
                label="Category"
                :items="categories"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" />
                    </template>
                    <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedTimeframe"
                label="Time Period"
                :items="timeframes"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          
          <!-- Description -->
          <div v-if="leaderboard?.metadata?.description" class="mt-3">
            <v-chip color="info" variant="tonal" size="small">
              <v-icon start size="16">mdi-information</v-icon>
              {{ leaderboard.metadata.description }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Leaderboard -->
      <v-card elevation="2">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-format-list-numbered</v-icon>
          Top Performers
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="refreshLeaderboard"
            :loading="leaderboardLoading"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <!-- Loading State -->
          <div v-if="leaderboardLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="text-h6 mt-4">Loading leaderboard...</p>
          </div>

          <!-- Leaderboard Entries -->
          <div v-else-if="leaderboard?.entries?.length > 0">
            <!-- Top 3 Podium -->
            <div class="podium-section pa-6">
              <v-row>
                <v-col
                  v-for="(entry, index) in leaderboard.entries.slice(0, 3)"
                  :key="entry.userId"
                  cols="12"
                  md="4"
                  :class="{ 'order-1': index === 1, 'order-0': index === 0, 'order-2': index === 2 }"
                >
                  <v-card
                    :color="getRankColor(entry.rank)"
                    variant="elevated"
                    elevation="4"
                    class="text-center podium-card"
                    :class="{ 'current-user': isCurrentUser(entry.userId) }"
                  >
                    <v-card-text class="pa-4">
                      <v-avatar
                        :size="index === 0 ? 80 : 64"
                        :color="entry.userAvatar ? undefined : 'primary'"
                        class="mb-3"
                      >
                        <v-img v-if="entry.userAvatar" :src="entry.userAvatar" />
                        <v-icon v-else size="32">mdi-account</v-icon>
                      </v-avatar>
                      
                      <div class="mb-2">
                        <v-icon
                          :color="entry.rank === 1 ? 'yellow' : 'white'"
                          :size="index === 0 ? 40 : 32"
                        >
                          {{ getRankIcon(entry.rank) }}
                        </v-icon>
                      </div>
                      
                      <h3 class="text-h6 font-weight-bold text-white mb-1">
                        {{ entry.userName || 'Anonymous' }}
                      </h3>
                      
                      <div class="text-h5 font-weight-bold text-white">
                        {{ formatScore(entry.score, selectedCategory) }}
                      </div>
                      
                      <div v-if="isCurrentUser(entry.userId)" class="mt-2">
                        <v-chip color="white" text-color="primary" size="small">
                          <v-icon start size="16">mdi-account</v-icon>
                          You
                        </v-chip>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Remaining Rankings -->
            <v-divider />
            <div class="rankings-list">
              <v-list>
                <v-list-item
                  v-for="entry in leaderboard.entries.slice(3)"
                  :key="entry.userId"
                  class="ranking-item"
                  :class="{ 'current-user-item': isCurrentUser(entry.userId) }"
                >
                  <template #prepend>
                    <div class="rank-number">
                      <v-chip
                        :color="isCurrentUser(entry.userId) ? 'primary' : 'grey-lighten-1'"
                        size="small"
                        variant="elevated"
                      >
                        #{{ entry.rank }}
                      </v-chip>
                    </div>
                    
                    <v-avatar
                      size="48"
                      :color="entry.userAvatar ? undefined : 'grey-lighten-1'"
                      class="ml-3"
                    >
                      <v-img v-if="entry.userAvatar" :src="entry.userAvatar" />
                      <v-icon v-else>mdi-account</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ entry.userName || 'Anonymous' }}
                    <v-chip
                      v-if="isCurrentUser(entry.userId)"
                      color="primary"
                      size="x-small"
                      variant="tonal"
                      class="ml-2"
                    >
                      You
                    </v-chip>
                  </v-list-item-title>

                  <template #append>
                    <div class="text-right">
                      <div class="text-h6 font-weight-bold">
                        {{ formatScore(entry.score, selectedCategory) }}
                      </div>
                      <div v-if="entry.metadata" class="text-caption text-grey-darken-1">
                        <!-- Additional metadata based on category -->
                        <span v-if="selectedCategory === 'points' && entry.metadata.level">
                          Level {{ JSON.parse(entry.metadata).level }}
                        </span>
                        <span v-else-if="selectedCategory === 'accuracy' && entry.metadata.totalQuestions">
                          {{ JSON.parse(entry.metadata).totalQuestions }} questions
                        </span>
                        <span v-else-if="selectedCategory === 'streak' && entry.metadata.longestDailyStreak">
                          Best: {{ JSON.parse(entry.metadata).longestDailyStreak }} days
                        </span>
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-trophy-outline</v-icon>
            <h3 class="text-h6 mt-4">No rankings available</h3>
            <p class="text-body-2">Start studying to appear on the leaderboard!</p>
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.leaderboard-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24px 0;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.podium-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.podium-card {
  transition: transform 0.2s ease;
}

.podium-card:hover {
  transform: translateY(-4px);
}

.current-user {
  border: 3px solid rgb(var(--v-theme-warning)) !important;
  box-shadow: 0 0 20px rgba(var(--v-theme-warning), 0.3) !important;
}

.ranking-item {
  transition: background-color 0.2s ease;
}

.ranking-item:hover {
  background: rgba(var(--v-theme-surface), 0.05);
}

.current-user-item {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.rank-number {
  min-width: 60px;
  text-align: center;
}

.rankings-list {
  max-height: 600px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .leaderboard-page {
    padding: 16px 0;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .podium-section {
    padding: 16px;
  }
}
</style>