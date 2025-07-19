<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Header with Stats -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-text class="pa-6">
            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">
                  <Icon icon="solar:trophy-bold-duotone" class="mr-2" size="36" />
                  Global Leaderboard
                </h1>
                <p class="text-subtitle-1 text-grey100">
                  See how you rank against other learners worldwide
                </p>
              </div>
              
              <v-chip
                v-if="getCurrentUserRank()"
                color="primary"
                variant="elevated"
                size="large"
                class="font-weight-bold"
              >
                <Icon icon="solar:user-bold-duotone" class="mr-2" />
                Your Rank: #{{ getCurrentUserRank() }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedCategory"
                  label="Category"
                  :items="categories"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <Icon :icon="item.raw.icon" size="20" class="text-medium-emphasis" />
                      </template>
                      <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template #prepend-inner>
                    <Icon :icon="getCategoryIcon(selectedCategory)" size="20" />
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedTimeframe"
                  label="Time Period"
                  :items="timeframes"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                >
                  <template #prepend-inner>
                    <Icon icon="solar:calendar-mark-bold-duotone" size="20" />
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Top 3 Podium -->
    <v-row v-if="!leaderboardLoading && leaderboard?.entries?.length > 0" class="mb-6">
      <v-col cols="12">
        <v-card elevation="10" class="podium-section">
          <v-card-text class="pa-6">
            <h2 class="text-h5 font-weight-bold text-center mb-6">
              <Icon icon="solar:crown-star-bold-duotone" class="mr-2 text-warning" />
              Top Performers
            </h2>
            <v-row>
              <v-col
                v-for="(entry, index) in getTopThree()"
                :key="entry.userId"
                cols="12"
                md="4"
                :class="{ 'order-1': index === 1, 'order-0': index === 0, 'order-2': index === 2 }"
              >
                <v-card
                  :variant="entry.rank === 1 ? 'flat' : 'tonal'"
                  :color="getPodiumColor(entry.rank)"
                  elevation="10"
                  class="text-center podium-card"
                  :class="{ 'current-user': isCurrentUser(entry.userId) }"
                >
                  <v-card-text class="pa-4">
                    <!-- Crown for first place -->
                    <div v-if="entry.rank === 1" class="mb-2">
                      <Icon icon="solar:crown-star-bold-duotone" size="48" color="yellow" />
                    </div>
                    
                    <!-- Avatar -->
                    <v-avatar
                      :size="entry.rank === 1 ? 100 : 80"
                      :color="entry.userAvatar ? undefined : 'white'"
                      class="mb-3 elevation-4"
                    >
                      <v-img v-if="entry.userAvatar" :src="entry.userAvatar" />
                      <Icon v-else icon="solar:user-bold-duotone" size="40" />
                    </v-avatar>
                    
                    <!-- Rank Badge -->
                    <div class="mb-3">
                      <v-chip
                        :color="getRankChipColor(entry.rank)"
                        variant="elevated"
                        size="large"
                        class="font-weight-bold"
                      >
                        <Icon :icon="getRankIcon(entry.rank)" class="mr-1" />
                        #{{ entry.rank }}
                      </v-chip>
                    </div>
                    
                    <!-- User Name -->
                    <h3 class="text-h6 font-weight-bold mb-1">
                      {{ entry.userName || 'Anonymous' }}
                    </h3>
                    
                    <!-- Score -->
                    <div class="text-h4 font-weight-bold mb-2">
                      {{ formatScore(entry.score, selectedCategory) }}
                    </div>
                    
                    <!-- Additional Info -->
                    <div v-if="entry.metadata" class="text-caption text-medium-emphasis">
                      {{ getMetadataDisplay(entry.metadata, selectedCategory) }}
                    </div>
                    
                    <!-- Current User Badge -->
                    <div v-if="isCurrentUser(entry.userId)" class="mt-3">
                      <v-chip color="white" text-color="primary" size="small">
                        <Icon icon="solar:user-bold-duotone" class="mr-1" size="16" />
                        You
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Leaderboard -->
    <v-row>
      <v-col cols="12">
        <UiParentCard title="Complete Rankings">
          <template #action>
            <v-btn
              icon
              variant="text"
              @click="refreshLeaderboard"
              :loading="leaderboardLoading"
            >
              <Icon icon="solar:refresh-circle-bold-duotone" />
            </v-btn>
          </template>

          <!-- Loading State -->
          <div v-if="leaderboardLoading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="text-h6 mt-4">Loading rankings...</p>
          </div>

          <!-- Rankings List -->
          <div v-else-if="leaderboard?.entries?.length > 0">
            <v-list lines="two" class="pa-0">
              <v-list-item
                v-for="(entry, index) in getRemainingEntries()"
                :key="entry.userId"
                class="ranking-item px-4"
                :class="{ 'current-user-item': isCurrentUser(entry.userId) }"
              >
                <template #prepend>
                  <div class="rank-display mr-4">
                    <v-chip
                      :color="isCurrentUser(entry.userId) ? 'primary' : 'default'"
                      :variant="isCurrentUser(entry.userId) ? 'flat' : 'tonal'"
                      size="small"
                    >
                      #{{ entry.rank }}
                    </v-chip>
                  </div>
                  
                  <v-avatar
                    size="56"
                    :color="entry.userAvatar ? undefined : 'grey-lighten-1'"
                  >
                    <v-img v-if="entry.userAvatar" :src="entry.userAvatar" />
                    <Icon v-else icon="solar:user-bold-duotone" size="28" />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-semibold">
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
                <v-list-item-subtitle>
                  {{ getMetadataDisplay(entry.metadata, selectedCategory) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="text-right">
                    <div class="text-h5 font-weight-bold">
                      {{ formatScore(entry.score, selectedCategory) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getCategoryLabel(selectedCategory) }}
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <!-- Show More Button -->
            <div v-if="hasMoreEntries" class="text-center pa-4">
              <v-btn
                color="primary"
                variant="tonal"
                @click="loadMore"
              >
                Show More
                <Icon icon="solar:arrow-down-bold-duotone" class="ml-1" />
              </v-btn>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <Icon icon="solar:trophy-broken-line-duotone" size="64" class="mb-4 text-grey-lighten-1" />
            <h5 class="text-h5 mb-2">No Rankings Available</h5>
            <p class="text-body-1 text-grey100 mb-4">
              Be the first to claim the top spot!
            </p>
            <v-btn
              color="primary"
              variant="flat"
              to="/study"
            >
              Start Studying
              <Icon icon="solar:arrow-right-bold-duotone" class="ml-1" />
            </v-btn>
          </div>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Breadcrumb
const page = ref({ title: 'Leaderboard' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Leaderboard',
    disabled: true,
    to: ''
  }
])

// State management
const selectedCategory = ref('points')
const selectedTimeframe = ref('all_time')
const displayLimit = ref(20)
const hasMoreEntries = ref(false)

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
  displayLimit.value = 20
  refreshLeaderboard()
})

// Available categories and timeframes
const categories = [
  { 
    title: 'Total Points', 
    value: 'points', 
    icon: 'solar:star-bold-duotone', 
    description: 'Points earned from studying and achievements' 
  },
  { 
    title: 'Accuracy', 
    value: 'accuracy', 
    icon: 'solar:target-bold-duotone', 
    description: 'Overall question accuracy (min. 50 questions)' 
  },
  { 
    title: 'Study Streak', 
    value: 'streak', 
    icon: 'solar:fire-bold-duotone', 
    description: 'Current daily study streak' 
  },
  { 
    title: 'Questions Answered', 
    value: 'questions', 
    icon: 'solar:question-circle-bold-duotone', 
    description: 'Total number of questions answered' 
  },
  { 
    title: 'Study Time', 
    value: 'study_time', 
    icon: 'solar:clock-circle-bold-duotone', 
    description: 'Total time spent studying' 
  }
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

const getCategoryIcon = (category: string) => {
  const cat = categories.find(c => c.value === category)
  return cat?.icon || 'solar:star-bold-duotone'
}

const getCategoryLabel = (category: string) => {
  const cat = categories.find(c => c.value === category)
  return cat?.title || 'Score'
}

const getPodiumColor = (rank: number) => {
  switch (rank) {
    case 1: return 'warning'
    case 2: return 'grey'
    case 3: return 'deep-orange'
    default: return 'primary'
  }
}

const getRankChipColor = (rank: number) => {
  switch (rank) {
    case 1: return 'yellow'
    case 2: return 'white'
    case 3: return 'orange'
    default: return 'primary'
  }
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return 'solar:trophy-bold-duotone'
    case 2: return 'solar:medal-star-bold-duotone'
    case 3: return 'solar:medal-star-bold-duotone'
    default: return 'solar:hashtag-circle-bold-duotone'
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

const getMetadataDisplay = (metadata: string, category: string) => {
  if (!metadata) return ''
  
  try {
    const data = JSON.parse(metadata)
    switch (category) {
      case 'points':
        return data.level ? `Level ${data.level}` : ''
      case 'accuracy':
        return data.totalQuestions ? `${data.totalQuestions} questions answered` : ''
      case 'streak':
        return data.longestDailyStreak ? `Best streak: ${data.longestDailyStreak} days` : ''
      case 'questions':
        return data.accuracy ? `${Math.round(data.accuracy)}% accuracy` : ''
      case 'study_time':
        return data.sessions ? `${data.sessions} study sessions` : ''
      default:
        return ''
    }
  } catch (e) {
    return ''
  }
}

const getTopThree = () => {
  if (!leaderboard.value?.entries) return []
  return leaderboard.value.entries.slice(0, 3)
}

const getRemainingEntries = () => {
  if (!leaderboard.value?.entries) return []
  const remaining = leaderboard.value.entries.slice(3, displayLimit.value)
  hasMoreEntries.value = leaderboard.value.entries.length > displayLimit.value
  return remaining
}

const loadMore = () => {
  displayLimit.value += 20
}
</script>

<style scoped>
.podium-section {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
}

.podium-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
}

.podium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.podium-card.current-user {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 24px rgba(var(--v-theme-primary), 0.2) !important;
}

.ranking-item {
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(var(--v-theme-borderColor), 0.1);
}

.ranking-item:hover {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.current-user-item {
  background: rgba(var(--v-theme-primary), 0.05) !important;
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.rank-display {
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-white-70 {
  opacity: 0.7;
}

/* Rank badge styles */
.v-chip--size-small {
  font-weight: 600;
}

/* Mobile optimizations */
@media (max-width: 960px) {
  .podium-card {
    margin-bottom: 12px;
  }
  
  .rank-display {
    min-width: 60px;
  }
  
  .ranking-item {
    padding: 8px !important;
  }
  
  .v-avatar {
    width: 40px !important;
    height: 40px !important;
  }
}
</style>