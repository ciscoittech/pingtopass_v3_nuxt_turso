<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import VueApexCharts from 'vue3-apexcharts'

interface XPActivity {
  activity: string
  xp: number
  time: string
  icon: string
}

interface UserLevelData {
  level: number
  currentXP: number
  xpToNextLevel: number
  totalXP: number
  title: string
  nextTitle: string
  rank: string
  levelProgress: number
  xpBreakdown: {
    studySessions: number
    testsCompleted: number
    perfectScores: number
    achievements: number
    dailyBonus: number
  }
  recentXP: XPActivity[]
  milestones: {
    previous: any
    next: any
  }
  multipliers: {
    streak: number
    premium: number
    event: number
  }
  stats: any
  levelBoundaries: any
}

// Props
const props = defineProps<{
  dense?: boolean
}>()

// State
const loading = ref(true)
const userLevel = ref<UserLevelData | null>(null)
const showDetails = ref(false)
const selectedTab = ref('overview')

// Chart options
const progressChartOptions = computed(() => ({
  chart: {
    type: 'radialBar',
    sparkline: {
      enabled: true
    }
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      track: {
        background: '#e7e7e7',
        strokeWidth: '97%',
        margin: 5
      },
      dataLabels: {
        name: {
          show: false
        },
        value: {
          offsetY: -2,
          fontSize: '16px',
          fontWeight: 600
        }
      }
    }
  },
  grid: {
    padding: {
      top: -10
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      shadeIntensity: 0.4,
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 53, 91]
    }
  },
  labels: ['Progress']
}))

const progressChartSeries = computed(() => 
  userLevel.value ? [userLevel.value.levelProgress] : [0]
)

// XP breakdown chart
const breakdownChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    sparkline: {
      enabled: props.dense
    }
  },
  labels: ['Study Sessions', 'Tests', 'Perfect Scores', 'Achievements', 'Daily Bonus'],
  colors: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'],
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total XP',
            formatter: () => formatXP(userLevel.value?.totalXP || 0)
          }
        }
      }
    }
  },
  legend: {
    show: !props.dense,
    position: 'bottom'
  },
  dataLabels: {
    enabled: false
  },
  responsive: [{
    breakpoint: 600,
    options: {
      chart: {
        height: 200
      }
    }
  }]
}))

const breakdownChartSeries = computed(() => {
  if (!userLevel.value) return []
  const breakdown = userLevel.value.xpBreakdown
  return [
    breakdown.studySessions,
    breakdown.testsCompleted,
    breakdown.perfectScores,
    breakdown.achievements,
    breakdown.dailyBonus
  ]
})

// Fetch level data
const fetchLevelData = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/xp/user-level')
    
    if (data) {
      userLevel.value = data
    }
  } catch (error) {
    console.error('Failed to fetch level data:', error)
  } finally {
    loading.value = false
  }
}

// Format XP numbers
const formatXP = (xp: number) => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`
  return xp.toString()
}

// Get level color based on tier
const getLevelColor = (level: number) => {
  if (level >= 20) return 'red'
  if (level >= 15) return 'orange'
  if (level >= 10) return 'purple'
  if (level >= 5) return 'blue'
  return 'green'
}

// Get rank icon
const getRankIcon = (rank: string) => {
  if (rank.includes('Diamond')) return 'solar:star-shine-bold'
  if (rank.includes('Platinum')) return 'solar:crown-star-bold'
  if (rank.includes('Gold')) return 'solar:medal-star-bold'
  if (rank.includes('Silver')) return 'solar:medal-ribbons-star-bold'
  return 'solar:star-bold'
}

// Calculate total multiplier
const totalMultiplier = computed(() => {
  if (!userLevel.value) return 1
  const m = userLevel.value.multipliers
  return m.streak * m.premium * m.event
})

onMounted(() => {
  fetchLevelData()
})
</script>

<template>
  <v-card 
    :elevation="2"
    :class="{ 'pa-3': dense }"
    class="xp-level-card"
  >
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between pa-3">
      <div class="d-flex align-center">
        <Icon icon="solar:cup-star-bold-duotone" size="24" class="mr-2 text-warning" />
        <span class="text-h6">Level & Experience</span>
      </div>
      
      <v-btn
        v-if="!dense"
        variant="text"
        size="small"
        @click="showDetails = !showDetails"
      >
        {{ showDetails ? 'Less' : 'More' }}
        <Icon 
          :icon="showDetails ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'" 
          class="ml-1" 
        />
      </v-btn>
    </v-card-title>
    
    <v-card-text class="pa-3 pt-0">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="40" />
      </div>
      
      <template v-else-if="userLevel">
        <!-- Main Level Display -->
        <div class="level-display mb-4">
          <v-row align="center" no-gutters>
            <!-- Level Badge -->
            <v-col cols="auto">
              <div class="level-badge" :class="`level-${getLevelColor(userLevel.level)}`">
                <div class="level-number">{{ userLevel.level }}</div>
                <div class="level-label">LEVEL</div>
              </div>
            </v-col>
            
            <!-- Progress Info -->
            <v-col class="pl-4">
              <div class="d-flex align-center mb-1">
                <h3 class="text-h6 font-weight-bold mr-2">{{ userLevel.title }}</h3>
                <v-chip 
                  size="x-small" 
                  :color="getLevelColor(userLevel.level)"
                  variant="tonal"
                >
                  {{ userLevel.rank }}
                  <Icon :icon="getRankIcon(userLevel.rank)" size="14" class="ml-1" />
                </v-chip>
              </div>
              
              <!-- XP Progress -->
              <div class="mb-2">
                <div class="d-flex justify-space-between align-center text-caption mb-1">
                  <span>{{ formatXP(userLevel.currentXP) }} / {{ formatXP(userLevel.xpToNextLevel) }} XP</span>
                  <span class="text-grey">{{ Math.round(userLevel.levelProgress) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="userLevel.levelProgress"
                  height="8"
                  rounded
                  :color="getLevelColor(userLevel.level)"
                  class="level-progress-bar"
                />
              </div>
              
              <!-- Next Level Preview -->
              <div class="text-caption text-grey100">
                Next: <strong>{{ userLevel.nextTitle }}</strong> at Level {{ userLevel.level + 1 }}
              </div>
            </v-col>
            
            <!-- Radial Progress (Desktop) -->
            <v-col v-if="!$vuetify.display.smAndDown" cols="auto" class="pl-4">
              <VueApexCharts
                type="radialBar"
                :height="120"
                :options="progressChartOptions"
                :series="progressChartSeries"
              />
            </v-col>
          </v-row>
        </div>
        
        <!-- Active Multipliers -->
        <v-alert
          v-if="totalMultiplier > 1"
          density="compact"
          variant="tonal"
          color="success"
          class="mb-3"
        >
          <div class="d-flex align-center">
            <Icon icon="solar:fire-bold" size="20" class="mr-2" />
            <span class="text-caption">
              <strong>{{ totalMultiplier }}x XP</strong> multiplier active
              <span v-if="userLevel.multipliers.streak > 1" class="ml-1">
                ({{ userLevel.multipliers.streak }}x streak bonus)
              </span>
            </span>
          </div>
        </v-alert>
        
        <!-- Recent XP Gains -->
        <div class="recent-xp-section">
          <div class="d-flex align-center justify-space-between mb-2">
            <h4 class="text-subtitle-2">Recent XP</h4>
            <v-chip size="x-small" variant="tonal">
              +{{ userLevel.recentXP.reduce((sum, item) => sum + item.xp, 0) }} today
            </v-chip>
          </div>
          
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="(activity, index) in userLevel.recentXP.slice(0, dense ? 3 : 5)"
              :key="index"
              class="px-0 py-1"
            >
              <template v-slot:prepend>
                <v-avatar size="28" variant="tonal" :color="getLevelColor(userLevel.level)">
                  <Icon :icon="activity.icon" size="16" />
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-body-2">
                {{ activity.activity }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="text-caption">
                {{ activity.time }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <span class="xp-gain font-weight-bold">
                  +{{ activity.xp }} XP
                </span>
              </template>
            </v-list-item>
          </v-list>
        </div>
        
        <!-- Expanded Details -->
        <v-expand-transition>
          <div v-if="showDetails && !dense" class="mt-4">
            <!-- Tabs -->
            <v-tabs
              v-model="selectedTab"
              density="compact"
              class="mb-3"
            >
              <v-tab value="overview">Overview</v-tab>
              <v-tab value="breakdown">XP Breakdown</v-tab>
              <v-tab value="milestones">Milestones</v-tab>
            </v-tabs>
            
            <!-- Tab Content -->
            <v-window v-model="selectedTab">
              <!-- Overview Tab -->
              <v-window-item value="overview">
                <v-row dense>
                  <v-col cols="6" sm="3">
                    <div class="stat-box text-center pa-2 rounded">
                      <div class="text-h6 font-weight-bold text-primary">
                        {{ userLevel.stats.daysActive }}
                      </div>
                      <div class="text-caption">Days Active</div>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="stat-box text-center pa-2 rounded">
                      <div class="text-h6 font-weight-bold text-success">
                        {{ userLevel.stats.totalHoursStudied }}h
                      </div>
                      <div class="text-caption">Hours Studied</div>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="stat-box text-center pa-2 rounded">
                      <div class="text-h6 font-weight-bold text-warning">
                        {{ formatXP(userLevel.stats.questionsAnswered) }}
                      </div>
                      <div class="text-caption">Questions</div>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="stat-box text-center pa-2 rounded">
                      <div class="text-h6 font-weight-bold text-info">
                        {{ userLevel.stats.averageAccuracy }}%
                      </div>
                      <div class="text-caption">Accuracy</div>
                    </div>
                  </v-col>
                </v-row>
              </v-window-item>
              
              <!-- XP Breakdown Tab -->
              <v-window-item value="breakdown">
                <VueApexCharts
                  type="donut"
                  :height="250"
                  :options="breakdownChartOptions"
                  :series="breakdownChartSeries"
                />
              </v-window-item>
              
              <!-- Milestones Tab -->
              <v-window-item value="milestones">
                <div class="milestones-content">
                  <!-- Previous Milestone -->
                  <v-alert
                    density="compact"
                    variant="tonal"
                    color="success"
                    class="mb-3"
                  >
                    <div class="d-flex align-center">
                      <Icon icon="solar:verified-check-bold" size="20" class="mr-2" />
                      <div>
                        <div class="font-weight-medium">
                          Level {{ userLevel.milestones.previous.level }} Achieved!
                        </div>
                        <div class="text-caption">
                          Unlocked: {{ userLevel.milestones.previous.title }}
                        </div>
                      </div>
                    </div>
                  </v-alert>
                  
                  <!-- Next Milestone -->
                  <v-card variant="outlined" class="pa-3">
                    <div class="d-flex align-center mb-2">
                      <Icon icon="solar:lock-keyhole-minimalistic-bold-duotone" size="20" class="mr-2" />
                      <h4 class="text-subtitle-2">Next Milestone: Level {{ userLevel.milestones.next.level }}</h4>
                    </div>
                    <div class="text-body-2 mb-2">
                      {{ formatXP(userLevel.milestones.next.xpRequired) }} XP needed
                    </div>
                    <div class="text-caption text-grey100">
                      <strong>Rewards:</strong>
                      <ul class="pl-4 mt-1">
                        <li v-for="reward in userLevel.milestones.next.rewards" :key="reward">
                          {{ reward }}
                        </li>
                      </ul>
                    </div>
                  </v-card>
                </div>
              </v-window-item>
            </v-window>
          </div>
        </v-expand-transition>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.xp-level-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Level Badge Styling */
.level-badge {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-badge::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--badge-color-1), var(--badge-color-2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.level-badge.level-green {
  --badge-color-1: #4CAF50;
  --badge-color-2: #81C784;
}

.level-badge.level-blue {
  --badge-color-1: #2196F3;
  --badge-color-2: #64B5F6;
}

.level-badge.level-purple {
  --badge-color-1: #9C27B0;
  --badge-color-2: #BA68C8;
}

.level-badge.level-orange {
  --badge-color-1: #FF9800;
  --badge-color-2: #FFB74D;
}

.level-badge.level-red {
  --badge-color-1: #F44336;
  --badge-color-2: #EF5350;
}

.level-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.level-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  opacity: 0.7;
}

/* Progress Bar Animation */
.level-progress-bar :deep(.v-progress-linear__determinate) {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    currentColor 50%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.3) 100%
  );
  background-size: 20px 100%;
  animation: progressStripe 1s linear infinite;
}

@keyframes progressStripe {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
  }
}

/* XP Gain Animation */
.xp-gain {
  color: rgb(var(--v-theme-success));
  font-size: 0.875rem;
  position: relative;
}

@keyframes xpPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.recent-xp-section .v-list-item:hover .xp-gain {
  animation: xpPop 0.3s ease;
}

/* Stat Boxes */
.stat-box {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  transition: all 0.2s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Mobile Adjustments */
@media (max-width: 600px) {
  .level-badge {
    width: 60px;
    height: 60px;
  }
  
  .level-number {
    font-size: 22px;
  }
  
  .level-label {
    font-size: 8px;
  }
  
  .xp-gain {
    font-size: 0.75rem;
  }
}
</style>