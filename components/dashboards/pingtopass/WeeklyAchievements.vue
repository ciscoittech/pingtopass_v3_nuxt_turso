<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
// import confetti from 'canvas-confetti' // TODO: Install package

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  points: number
  progress: number
  targetValue: number
  currentValue: number
  isCompleted: boolean
  completedAt: string | null
}

// Props
const props = defineProps<{
  dense?: boolean
}>()

// State
const loading = ref(true)
const weeklyPoints = ref(0)
const totalAchievements = ref(0)
const activeAchievements = ref<Achievement[]>([])
const recentlyCompleted = ref<Achievement[]>([])
const nearCompletion = ref<Achievement[]>([])
const selectedTab = ref('active')

// Fetch achievements data
const fetchAchievements = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/achievements/weekly')
    
    if (data) {
      weeklyPoints.value = data.weeklyPoints
      totalAchievements.value = data.totalAchievements
      activeAchievements.value = data.activeAchievements
      recentlyCompleted.value = data.recentlyCompleted
      nearCompletion.value = data.nearCompletion
      
      // Check for newly completed achievements
      checkForNewCompletions()
    }
  } catch (error) {
    console.error('Failed to fetch achievements:', error)
  } finally {
    loading.value = false
  }
}

// Check for newly completed achievements and trigger celebration
const checkForNewCompletions = () => {
  const lastCheck = localStorage.getItem('lastAchievementCheck')
  const now = new Date().toISOString()
  
  if (lastCheck) {
    const newCompletions = recentlyCompleted.value.filter(
      a => a.completedAt && a.completedAt > lastCheck
    )
    
    if (newCompletions.length > 0) {
      // Trigger celebration for the newest completion
      celebrateAchievement(newCompletions[0])
    }
  }
  
  localStorage.setItem('lastAchievementCheck', now)
}

// Celebrate achievement with confetti
const celebrateAchievement = (achievement: Achievement) => {
  // TODO: Add confetti when package is installed
  // const colors = {
  //   common: ['#4CAF50', '#8BC34A'],
  //   rare: ['#2196F3', '#03A9F4'],
  //   epic: ['#9C27B0', '#E91E63'],
  //   legendary: ['#FFD700', '#FFA500']
  // }
  
  // confetti({
  //   particleCount: 100,
  //   spread: 70,
  //   origin: { y: 0.6 },
  //   colors: colors[achievement.rarity as keyof typeof colors] || colors.common
  // })
  
  // Show notification (could be enhanced with a toast component)
  console.log(`Achievement unlocked: ${achievement.name}!`)
  
  // Add visual feedback
  const element = document.querySelector(`[data-achievement-id="${achievement.id}"]`)
  if (element) {
    element.classList.add('achievement-unlock')
    setTimeout(() => {
      element.classList.remove('achievement-unlock')
    }, 1000)
  }
}

// Get rarity color
const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'grey',
    rare: 'blue',
    epic: 'purple',
    legendary: 'orange'
  }
  return colors[rarity as keyof typeof colors] || 'grey'
}

// Get category icon
const getCategoryIcon = (category: string) => {
  const icons = {
    streak: 'solar:fire-bold-duotone',
    accuracy: 'solar:target-bold-duotone',
    volume: 'solar:chart-2-bold-duotone',
    milestone: 'solar:flag-bold-duotone',
    special: 'solar:star-shine-bold-duotone'
  }
  return icons[category as keyof typeof icons] || 'solar:medal-star-bold-duotone'
}

// Format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  return 'Just now'
}

onMounted(() => {
  fetchAchievements()
})
</script>

<template>
  <v-card 
    elevation="10"
    :class="{ 'pa-3': dense }"
    class="weekly-achievements-card"
  >
    <v-card-title class="d-flex align-center justify-space-between pa-3">
      <div class="d-flex align-center">
        <Icon icon="solar:medal-ribbons-star-bold-duotone" size="24" class="mr-2 text-warning" />
        <span class="text-h6">Weekly Achievements</span>
      </div>
      
      <!-- Weekly Points -->
      <v-chip
        color="primary"
        variant="tonal"
        size="small"
      >
        <Icon icon="solar:star-bold-duotone" size="16" class="mr-1" />
        {{ weeklyPoints }} pts this week
      </v-chip>
    </v-card-title>
    
    <v-card-text class="pa-3 pt-0">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="40" />
      </div>
      
      <template v-else>
        <!-- Achievement Tabs -->
        <v-tabs
          v-model="selectedTab"
          density="compact"
          class="mb-3"
        >
          <v-tab value="active">
            Active
            <v-badge
              v-if="activeAchievements.length > 0"
              :content="activeAchievements.length"
              color="primary"
              inline
              class="ml-2"
            />
          </v-tab>
          <v-tab value="near">
            Near Complete
            <v-badge
              v-if="nearCompletion.length > 0"
              :content="nearCompletion.length"
              color="warning"
              inline
              class="ml-2"
            />
          </v-tab>
          <v-tab value="completed">
            Completed
            <v-badge
              v-if="totalAchievements > 0"
              :content="totalAchievements"
              color="success"
              inline
              class="ml-2"
            />
          </v-tab>
        </v-tabs>
        
        <!-- Tab Content -->
        <v-window v-model="selectedTab">
          <!-- Active Achievements -->
          <v-window-item value="active">
            <div v-if="activeAchievements.length === 0" class="text-center py-4 text-grey">
              <Icon icon="solar:clipboard-list-bold-duotone" size="48" class="mb-2" />
              <p class="text-caption">No active achievements</p>
            </div>
            <v-list v-else density="compact" class="pa-0">
              <v-list-item
                v-for="(achievement, index) in activeAchievements.slice(0, 3)"
                :key="achievement.id"
                :class="{ 'mb-2': index < 2 }"
                class="achievement-item rounded"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="getRarityColor(achievement.rarity)"
                    size="40"
                    variant="tonal"
                  >
                    <Icon :icon="achievement.icon" size="20" />
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ achievement.name }}
                  <v-chip
                    size="x-small"
                    :color="getRarityColor(achievement.rarity)"
                    variant="tonal"
                    class="ml-1"
                  >
                    {{ achievement.points }} pts
                  </v-chip>
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-caption">
                  {{ achievement.description }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <div class="text-right">
                    <div class="text-caption text-grey100">
                      {{ achievement.currentValue }}/{{ achievement.targetValue }}
                    </div>
                    <v-progress-linear
                      :model-value="achievement.progress"
                      height="4"
                      rounded
                      :color="achievement.progress >= 70 ? 'warning' : 'primary'"
                      class="mt-1"
                      style="width: 60px"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>
          
          <!-- Near Completion -->
          <v-window-item value="near">
            <div v-if="nearCompletion.length === 0" class="text-center py-4 text-grey">
              <Icon icon="solar:hourglass-line-bold-duotone" size="48" class="mb-2" />
              <p class="text-caption">No achievements near completion</p>
            </div>
            <v-list v-else density="compact" class="pa-0">
              <v-list-item
                v-for="(achievement, index) in nearCompletion"
                :key="achievement.id"
                :class="{ 'mb-2': index < nearCompletion.length - 1 }"
                class="achievement-item rounded bg-warning-lighten-5"
              >
                <template v-slot:prepend>
                  <v-avatar
                    color="warning"
                    size="40"
                    variant="tonal"
                  >
                    <Icon :icon="achievement.icon" size="20" />
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ achievement.name }}
                  <Icon 
                    icon="solar:fire-bold" 
                    size="16" 
                    class="ml-1 text-warning" 
                  />
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-caption">
                  Almost there! {{ 100 - achievement.progress }}% to go
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-progress-circular
                    :model-value="achievement.progress"
                    :size="40"
                    :width="4"
                    color="warning"
                  >
                    <span class="text-caption font-weight-bold">
                      {{ achievement.progress }}%
                    </span>
                  </v-progress-circular>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>
          
          <!-- Completed -->
          <v-window-item value="completed">
            <div v-if="recentlyCompleted.length === 0" class="text-center py-4 text-grey">
              <Icon icon="solar:cup-star-bold-duotone" size="48" class="mb-2" />
              <p class="text-caption">No completed achievements yet</p>
            </div>
            <v-list v-else density="compact" class="pa-0">
              <v-list-item
                v-for="(achievement, index) in recentlyCompleted"
                :key="achievement.id"
                :class="{ 'mb-2': index < recentlyCompleted.length - 1 }"
                class="achievement-item rounded bg-success-lighten-5"
              >
                <template v-slot:prepend>
                  <v-avatar
                    color="success"
                    size="40"
                    variant="flat"
                  >
                    <Icon icon="solar:verified-check-bold-duotone" size="20" />
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ achievement.name }}
                  <v-chip
                    size="x-small"
                    color="success"
                    variant="tonal"
                    class="ml-1"
                  >
                    +{{ achievement.points }} pts
                  </v-chip>
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-caption">
                  Completed {{ formatTimeAgo(achievement.completedAt!) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <Icon 
                    :icon="getCategoryIcon(achievement.category)" 
                    size="24" 
                    :color="getRarityColor(achievement.rarity)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>
        </v-window>
        
        <!-- View All Button -->
        <div class="text-center mt-3">
          <v-btn
            variant="tonal"
            size="small"
            block
            to="/achievements"
          >
            View All Achievements
            <Icon icon="solar:arrow-right-bold-duotone" class="ml-1" />
          </v-btn>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.weekly-achievements-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.achievement-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.achievement-item:hover {
  transform: translateX(4px);
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Rarity glow effects */
.achievement-item:has(.text-warning) {
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-warning), 0.2);
}

.achievement-item:has(.text-purple) {
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-purple), 0.2);
}

.achievement-item:has(.text-orange) {
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-orange), 0.2);
}

/* Badge animations */
.v-badge :deep(.v-badge__badge) {
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .v-tabs {
    min-height: 36px !important;
  }
  
  .v-tab {
    font-size: 0.75rem !important;
    padding: 0 8px !important;
  }
  
  .achievement-item {
    padding: 8px !important;
  }
}
</style>