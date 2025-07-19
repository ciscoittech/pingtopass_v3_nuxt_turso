<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Header with Stats -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-text class="pa-6">
            <v-row align="center">
              <v-col cols="12" md="8">
                <div class="d-flex align-center mb-3 flex-wrap">
                  <v-avatar :size="$vuetify.display.mobile ? 60 : 80" class="mr-3 mr-md-4">
                    <v-img :src="userAvatar" alt="User Avatar" />
                  </v-avatar>
                  <div class="flex-grow-1">
                    <h1 class="text-h5 text-md-h4 font-weight-bold mb-1">{{ userName }}'s Achievements</h1>
                    <div class="d-flex flex-wrap align-center gap-2">
                      <v-chip size="small" variant="tonal" color="primary">
                        <Icon icon="solar:ranking-bold-duotone" size="16" class="mr-1" />
                        Level {{ userLevel }}
                      </v-chip>
                      <v-chip size="small" variant="tonal" color="success">
                        <Icon icon="solar:star-bold-duotone" size="16" class="mr-1" />
                        {{ totalPoints }} Points
                      </v-chip>
                      <v-chip size="small" variant="tonal" color="warning">
                        <Icon icon="solar:shield-check-bold-duotone" size="16" class="mr-1" />
                        {{ unlockedCount }}/{{ totalAchievements }}
                      </v-chip>
                    </div>
                  </div>
                </div>
                
                <!-- Level Progress -->
                <div class="level-progress mt-4">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-body-2 font-weight-medium">Level {{ userLevel }}</span>
                    <span class="text-body-2 font-weight-medium">Level {{ userLevel + 1 }}</span>
                  </div>
                  <v-progress-linear
                    :model-value="levelProgress"
                    color="primary"
                    height="10"
                    rounded
                  >
                    <template #default="{ value }">
                      <span class="text-caption font-weight-bold">{{ Math.round(value) }}%</span>
                    </template>
                  </v-progress-linear>
                  <p class="text-caption text-center mt-1 text-medium-emphasis">
                    {{ currentLevelPoints }}/{{ nextLevelPoints }} XP
                  </p>
                </div>
              </v-col>
              
              <v-col cols="12" md="4" class="text-center mt-4 mt-md-0">
                <div class="achievement-stats">
                  <v-row dense>
                    <v-col cols="6" sm="3" md="6">
                      <v-card variant="tonal" color="warning" class="stat-box text-center">
                        <v-card-text class="pa-3">
                          <Icon icon="solar:medal-star-bold-duotone" size="32" class="mb-1" />
                          <h3 class="text-h5 font-weight-bold">{{ goldBadges }}</h3>
                          <p class="text-caption mb-0">Gold</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3" md="6">
                      <v-card variant="tonal" color="grey" class="stat-box text-center">
                        <v-card-text class="pa-3">
                          <Icon icon="solar:medal-star-bold-duotone" size="32" class="mb-1" />
                          <h3 class="text-h5 font-weight-bold">{{ silverBadges }}</h3>
                          <p class="text-caption mb-0">Silver</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3" md="6">
                      <v-card variant="tonal" color="brown" class="stat-box text-center">
                        <v-card-text class="pa-3">
                          <Icon icon="solar:medal-star-bold-duotone" size="32" class="mb-1" />
                          <h3 class="text-h5 font-weight-bold">{{ bronzeBadges }}</h3>
                          <p class="text-caption mb-0">Bronze</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3" md="6">
                      <v-card variant="tonal" color="error" class="stat-box text-center">
                        <v-card-text class="pa-3">
                          <Icon icon="solar:fire-bold-duotone" size="32" class="mb-1" />
                          <h3 class="text-h5 font-weight-bold">{{ currentStreak }}</h3>
                          <p class="text-caption mb-0">Day Streak</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filter Tabs -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-text class="pa-2">
            <v-tabs
              v-model="selectedCategory"
              bg-color="transparent"
              color="primary"
              align-tabs="center"
              density="comfortable"
            >
              <v-tab value="all">
                <Icon icon="solar:widget-6-bold-duotone" size="20" class="mr-2" />
                All
                <v-badge :content="totalAchievements" color="primary" class="ml-2" />
              </v-tab>
              <v-tab value="learning">
                <Icon icon="solar:book-2-bold-duotone" size="20" class="mr-2" />
                Learning
                <v-badge :content="learningCount" color="success" class="ml-2" />
              </v-tab>
              <v-tab value="performance">
                <Icon icon="solar:chart-2-bold-duotone" size="20" class="mr-2" />
                Performance
                <v-badge :content="performanceCount" color="warning" class="ml-2" />
              </v-tab>
              <v-tab value="special">
                <Icon icon="solar:star-shine-bold-duotone" size="20" class="mr-2" />
                Special
                <v-badge :content="specialCount" color="error" class="ml-2" />
              </v-tab>
              <v-tab value="social">
                <Icon icon="solar:users-group-rounded-bold-duotone" size="20" class="mr-2" />
                Social
                <v-badge :content="socialCount" color="info" class="ml-2" />
              </v-tab>
            </v-tabs>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Achievements Grid -->
    <v-row>
      <v-col
        v-for="achievement in filteredAchievements"
        :key="achievement.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          elevation="10"
          class="achievement-card h-100"
          :class="{ 
            'unlocked': achievement.unlocked,
            'locked': !achievement.unlocked 
          }"
          hover
        >
          <v-card-item class="text-center">
            <div class="achievement-icon mb-3">
              <v-badge
                v-if="achievement.unlocked && achievement.tier"
                :color="getTierColor(achievement.tier)"
                :icon="getTierIcon(achievement.tier)"
                offset-x="-10"
                offset-y="10"
              >
                <v-avatar
                  size="80"
                  :color="achievement.unlocked ? achievement.color : 'grey'"
                  variant="tonal"
                >
                  <Icon 
                    :icon="achievement.icon" 
                    size="40"
                    :class="{ 'greyscale': !achievement.unlocked }"
                  />
                </v-avatar>
              </v-badge>
              <v-avatar
                v-else
                size="80"
                :color="achievement.unlocked ? achievement.color : 'grey'"
                variant="tonal"
              >
                <Icon 
                  :icon="achievement.icon" 
                  size="40"
                  :class="{ 'greyscale': !achievement.unlocked }"
                />
              </v-avatar>
            </div>
            
            <v-card-title class="text-center">
              {{ achievement.title }}
            </v-card-title>
            
            <v-card-subtitle class="text-center">
              {{ achievement.description }}
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <!-- Progress for locked achievements -->
            <div v-if="!achievement.unlocked && achievement.progress !== undefined">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption">Progress</span>
                <span class="text-caption font-weight-bold">
                  {{ achievement.currentProgress }}/{{ achievement.targetProgress }}
                </span>
              </div>
              <v-progress-linear
                :model-value="achievement.progress"
                color="primary"
                height="6"
                rounded
              />
            </div>

            <!-- Unlocked info -->
            <div v-if="achievement.unlocked" class="text-center mt-3">
              <v-chip
                :color="achievement.color"
                size="small"
                variant="flat"
                class="font-weight-medium"
              >
                <Icon icon="solar:cup-star-bold-duotone" class="mr-1" size="16" />
                +{{ achievement.points }} XP
              </v-chip>
              <p class="text-caption text-medium-emphasis mt-2 mb-0">
                <Icon icon="solar:calendar-check-bold-duotone" size="14" class="mr-1" />
                {{ formatDate(achievement.unlockedAt) }}
              </p>
            </div>

            <!-- Locked info -->
            <div v-else class="text-center mt-3">
              <v-chip
                color="grey"
                size="small"
                variant="tonal"
                class="font-weight-medium"
              >
                <Icon icon="solar:lock-keyhole-bold-duotone" class="mr-1" size="16" />
                Locked
              </v-chip>
              <p class="text-caption text-medium-emphasis mt-2 mb-0">
                Complete to unlock
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <div v-if="filteredAchievements.length === 0" class="text-center py-12">
      <Icon icon="solar:medal-star-broken-line-duotone" size="64" class="mb-4 text-grey-lighten-1" />
      <h5 class="text-h5 mb-2">No Achievements in This Category</h5>
      <p class="text-body-1 text-grey100">
        Try a different category or keep studying to unlock achievements!
      </p>
    </div>

    <!-- Recent Unlocks -->
    <v-row v-if="recentUnlocks.length > 0" class="mt-6">
      <v-col cols="12">
        <UiParentCard title="Recent Unlocks">
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="unlock in recentUnlocks"
              :key="unlock.id"
              :dot-color="unlock.color"
              size="small"
            >
              <template v-slot:icon>
                <Icon :icon="unlock.icon" />
              </template>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <h6 class="text-h6">{{ unlock.title }}</h6>
                  <p class="text-body-2 text-medium-emphasis">{{ unlock.description }}</p>
                </div>
                <v-chip size="small" variant="tonal">
                  +{{ unlock.points }} XP
                </v-chip>
              </div>
              <template v-slot:opposite>
                <span class="text-caption">{{ formatRelativeTime(unlock.unlockedAt) }}</span>
              </template>
            </v-timeline-item>
          </v-timeline>
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
const page = ref({ title: 'Achievements' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Achievements',
    disabled: true,
    to: ''
  }
])

// State
const selectedCategory = ref('all')

// Mock user data
const userName = ref('John Doe')
const userAvatar = ref('/images/users/avatar-1.jpg')
const userLevel = ref(12)
const totalPoints = ref(4250)
const currentLevelPoints = ref(250)
const nextLevelPoints = ref(500)
const levelProgress = computed(() => (currentLevelPoints.value / nextLevelPoints.value) * 100)
const currentStreak = ref(7)

// Achievement stats
const goldBadges = ref(3)
const silverBadges = ref(8)
const bronzeBadges = ref(15)

// Mock achievements data
const achievements = ref([
  // Learning Achievements
  {
    id: '1',
    category: 'learning',
    title: 'First Steps',
    description: 'Complete your first study session',
    icon: 'solar:square-academic-cap-bold-duotone',
    color: 'primary',
    points: 50,
    unlocked: true,
    unlockedAt: new Date('2024-01-15'),
    tier: 'bronze'
  },
  {
    id: '2',
    category: 'learning',
    title: 'Study Marathon',
    description: 'Study for 5 hours in a single day',
    icon: 'solar:running-round-bold-duotone',
    color: 'info',
    points: 200,
    unlocked: true,
    unlockedAt: new Date('2024-01-20'),
    tier: 'silver'
  },
  {
    id: '3',
    category: 'learning',
    title: 'Knowledge Seeker',
    description: 'Complete 100 questions',
    icon: 'solar:book-2-bold-duotone',
    color: 'success',
    points: 150,
    unlocked: true,
    unlockedAt: new Date('2024-01-25'),
    tier: 'bronze',
    progress: 100,
    currentProgress: 100,
    targetProgress: 100
  },
  {
    id: '4',
    category: 'learning',
    title: 'Master Scholar',
    description: 'Complete 1000 questions',
    icon: 'solar:diploma-bold-duotone',
    color: 'warning',
    points: 500,
    unlocked: false,
    tier: 'gold',
    progress: 45,
    currentProgress: 450,
    targetProgress: 1000
  },
  // Performance Achievements
  {
    id: '5',
    category: 'performance',
    title: 'Perfect Score',
    description: 'Score 100% on any test',
    icon: 'solar:cup-star-bold-duotone',
    color: 'success',
    points: 100,
    unlocked: true,
    unlockedAt: new Date('2024-01-18'),
    tier: 'silver'
  },
  {
    id: '6',
    category: 'performance',
    title: 'Accuracy Expert',
    description: 'Maintain 90%+ accuracy for a week',
    icon: 'solar:target-bold-duotone',
    color: 'warning',
    points: 300,
    unlocked: false,
    tier: 'gold',
    progress: 60,
    currentProgress: 4,
    targetProgress: 7
  },
  {
    id: '7',
    category: 'performance',
    title: 'Speed Demon',
    description: 'Answer 50 questions in under 30 minutes',
    icon: 'solar:bolt-circle-bold-duotone',
    color: 'error',
    points: 150,
    unlocked: true,
    unlockedAt: new Date('2024-01-22'),
    tier: 'bronze'
  },
  // Special Achievements
  {
    id: '8',
    category: 'special',
    title: 'Night Owl',
    description: 'Study between midnight and 5 AM',
    icon: 'solar:moon-stars-bold-duotone',
    color: 'deep-purple',
    points: 100,
    unlocked: true,
    unlockedAt: new Date('2024-01-19'),
    tier: 'bronze'
  },
  {
    id: '9',
    category: 'special',
    title: 'Weekend Warrior',
    description: 'Study every weekend for a month',
    icon: 'solar:calendar-mark-bold-duotone',
    color: 'orange',
    points: 250,
    unlocked: false,
    progress: 75,
    currentProgress: 3,
    targetProgress: 4
  },
  {
    id: '10',
    category: 'special',
    title: 'Certification Champion',
    description: 'Pass a certification exam',
    icon: 'solar:medal-ribbons-star-bold-duotone',
    color: 'primary',
    points: 1000,
    unlocked: false,
    tier: 'gold'
  },
  // Social Achievements
  {
    id: '11',
    category: 'social',
    title: 'Team Player',
    description: 'Join a study group',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
    points: 100,
    unlocked: true,
    unlockedAt: new Date('2024-01-10'),
    tier: 'bronze'
  },
  {
    id: '12',
    category: 'social',
    title: 'Helpful Hero',
    description: 'Help 10 other students',
    icon: 'solar:hand-heart-bold-duotone',
    color: 'success',
    points: 200,
    unlocked: false,
    progress: 30,
    currentProgress: 3,
    targetProgress: 10
  }
])

// Computed
const filteredAchievements = computed(() => {
  if (selectedCategory.value === 'all') {
    return achievements.value
  }
  return achievements.value.filter(a => a.category === selectedCategory.value)
})

const totalAchievements = computed(() => achievements.value.length)
const unlockedCount = computed(() => achievements.value.filter(a => a.unlocked).length)
const learningCount = computed(() => achievements.value.filter(a => a.category === 'learning').length)
const performanceCount = computed(() => achievements.value.filter(a => a.category === 'performance').length)
const specialCount = computed(() => achievements.value.filter(a => a.category === 'special').length)
const socialCount = computed(() => achievements.value.filter(a => a.category === 'social').length)

const recentUnlocks = computed(() => {
  return achievements.value
    .filter(a => a.unlocked)
    .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
    .slice(0, 5)
})

// Helper functions
const getTierColor = (tier: string) => {
  const colors: Record<string, string> = {
    gold: 'warning',
    silver: 'grey',
    bronze: 'brown'
  }
  return colors[tier] || 'primary'
}

const getTierIcon = (tier: string) => {
  return 'solar:star-bold-duotone'
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}
</script>

<style scoped>
.level-progress {
  max-width: 500px;
}

.stat-box {
  transition: all 0.2s ease;
  cursor: pointer;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.achievement-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
}

.achievement-card.locked {
  opacity: 0.8;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.achievement-icon {
  position: relative;
  display: inline-block;
}

.greyscale {
  filter: grayscale(100%);
  opacity: 0.6;
}

/* Badge pulse animation */
.v-badge :deep(.v-badge__badge) {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Achievement unlock animation */
.achievement-unlock {
  animation: unlock 0.6s ease-out;
}

@keyframes unlock {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Progress bar animation */
.v-progress-linear :deep(.v-progress-linear__determinate) {
  transition: width 0.6s ease-out;
}

/* Mobile optimizations */
@media (max-width: 960px) {
  .stat-box {
    padding: 8px;
  }
  
  .achievement-card {
    margin-bottom: 8px;
  }
  
  .v-tab {
    min-width: auto;
    padding: 0 12px;
  }
  
  .v-tab .v-icon {
    display: none;
  }
}
</style>