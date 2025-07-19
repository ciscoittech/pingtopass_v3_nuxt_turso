<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'

interface LeaderboardUser {
  userId: string
  name: string
  picture?: string
  totalXp: number
  level: number
  rank: number
  testsCompleted: number
  avgScore: number
  studyStreak: number
  isCurrentUser?: boolean
}

interface CurrentUserStats {
  userId: string
  totalXp: number
  level: number
  rank: number
  testsCompleted: number
  avgScore: number
  progressToNext: number
}

// Props
const props = defineProps<{
  dense?: boolean
}>()

// State
const loading = ref(true)
const leaderboard = ref<LeaderboardUser[]>([])
const currentUser = ref<CurrentUserStats | null>(null)
const timeframe = ref<'week' | 'month' | 'all'>('week')

// Fetch leaderboard data
const fetchLeaderboard = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/leaderboard/mock', {
      query: {
        limit: 5,
        timeframe: timeframe.value
      }
    })
    
    if (data) {
      leaderboard.value = data.leaderboard
      currentUser.value = data.currentUser
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
  } finally {
    loading.value = false
  }
}

// Get rank badge color
const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return 'gold'
    case 2: return 'silver'
    case 3: return 'bronze'
    default: return 'grey'
  }
}

// Get rank icon
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return 'solar:cup-star-bold'
    case 2: return 'solar:medal-ribbons-star-bold'
    case 3: return 'solar:medal-star-bold'
    default: return 'solar:star-bold'
  }
}

// Format XP
const formatXP = (xp: number) => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`
  return xp.toString()
}

onMounted(() => {
  fetchLeaderboard()
})

// Watch timeframe changes
watch(timeframe, () => {
  fetchLeaderboard()
})
</script>

<template>
  <v-card 
    elevation="10"
    :class="{ 'pa-3': dense }"
    class="leaderboard-preview-card"
  >
    <v-card-title class="d-flex align-center justify-space-between pa-3">
      <div class="d-flex align-center">
        <Icon icon="solar:cup-star-bold-duotone" size="24" class="mr-2 text-warning" />
        <span class="text-h6">Leaderboard</span>
      </div>
      
      <!-- Timeframe selector -->
      <v-chip-group 
        v-model="timeframe" 
        mandatory 
        selected-class="text-primary"
        density="compact"
      >
        <v-chip 
          value="week" 
          size="x-small"
          variant="tonal"
        >
          Week
        </v-chip>
        <v-chip 
          value="month" 
          size="x-small"
          variant="tonal"
        >
          Month
        </v-chip>
        <v-chip 
          value="all" 
          size="x-small"
          variant="tonal"
        >
          All Time
        </v-chip>
      </v-chip-group>
    </v-card-title>
    
    <v-card-text class="pa-3 pt-0">
      <!-- Current User Progress -->
      <v-alert
        v-if="currentUser && currentUser.rank > 5"
        density="compact"
        variant="tonal"
        color="primary"
        class="mb-3"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-grey100">Your Rank</div>
            <div class="text-h5 font-weight-bold">#{{ currentUser.rank }}</div>
          </div>
          <div class="text-center">
            <div class="text-caption text-grey100">Progress to Next</div>
            <v-progress-linear
              :model-value="currentUser.progressToNext"
              height="6"
              rounded
              color="primary"
              class="mt-1"
              style="width: 100px"
            />
          </div>
          <div class="text-right">
            <div class="text-caption text-grey100">Total XP</div>
            <div class="text-h6 font-weight-bold">{{ formatXP(currentUser.totalXp) }}</div>
          </div>
        </div>
      </v-alert>
      
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="40" />
      </div>
      
      <!-- Leaderboard List -->
      <v-list v-else density="compact" class="pa-0">
        <v-list-item
          v-for="(user, index) in leaderboard"
          :key="user.userId"
          :class="{ 
            'bg-primary-lighten-5': user.isCurrentUser,
            'mb-1': index < leaderboard.length - 1
          }"
          class="rounded px-2"
        >
          <template v-slot:prepend>
            <!-- Rank Badge -->
            <div class="rank-badge mr-3" :class="`rank-${user.rank}`">
              <Icon 
                v-if="user.rank <= 3"
                :icon="getRankIcon(user.rank)" 
                size="20"
                :color="getRankColor(user.rank)"
              />
              <span v-else class="text-caption font-weight-bold">
                {{ user.rank }}
              </span>
            </div>
          </template>
          
          <!-- User Info -->
          <v-list-item-title class="d-flex align-center">
            <v-avatar size="28" class="mr-2">
              <v-img 
                v-if="user.picture" 
                :src="user.picture"
                :alt="user.name"
              />
              <v-icon v-else size="20">mdi-account</v-icon>
            </v-avatar>
            <span class="text-body-2 font-weight-medium">
              {{ user.name }}
              <v-icon v-if="user.isCurrentUser" size="16" color="primary" class="ml-1">
                mdi-account-check
              </v-icon>
            </span>
          </v-list-item-title>
          
          <v-list-item-subtitle class="d-flex align-center mt-1">
            <v-chip size="x-small" variant="tonal" class="mr-1">
              Lv {{ user.level }}
            </v-chip>
            <span class="text-caption text-grey100">
              {{ formatXP(user.totalXp) }} XP
            </span>
          </v-list-item-subtitle>
          
          <template v-slot:append>
            <!-- Stats -->
            <div class="text-right">
              <div class="d-flex align-center justify-end">
                <Icon 
                  icon="solar:cup-star-bold-duotone" 
                  size="14" 
                  class="mr-1 text-grey"
                />
                <span class="text-caption">{{ user.testsCompleted }}</span>
                <Icon 
                  icon="solar:fire-bold-duotone" 
                  size="14" 
                  class="mx-1 text-orange"
                />
                <span class="text-caption">{{ user.studyStreak }}</span>
              </div>
              <div class="text-caption text-grey100">
                {{ user.avgScore }}% avg
              </div>
            </div>
          </template>
        </v-list-item>
      </v-list>
      
      <!-- View Full Leaderboard -->
      <div class="text-center mt-3">
        <v-btn
          variant="tonal"
          size="small"
          block
          to="/leaderboard"
        >
          View Full Leaderboard
          <Icon icon="solar:arrow-right-bold-duotone" class="ml-1" />
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.leaderboard-preview-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.rank-1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.rank-2 {
  background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.3);
}

.rank-3 {
  background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.3);
}

/* Highlight animation for current user */
@keyframes highlightPulse {
  0% {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
  50% {
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
  100% {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}

.bg-primary-lighten-5 {
  animation: highlightPulse 3s ease-in-out infinite;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .v-chip-group {
    gap: 4px !important;
  }
  
  .rank-badge {
    width: 28px;
    height: 28px;
  }
}
</style>