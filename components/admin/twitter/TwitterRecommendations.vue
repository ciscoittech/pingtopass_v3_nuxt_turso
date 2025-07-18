<template>
  <div>
    <!-- Strategy Overview -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined" color="primary">
          <v-card-text>
            <h4 class="text-h6 mb-3">Strategic Focus Areas</h4>
            <v-row>
              <v-col
                v-for="(area, index) in focusAreas"
                :key="index"
                cols="12"
                md="3"
              >
                <div class="text-center">
                  <v-progress-circular
                    :model-value="area.score"
                    :size="80"
                    :width="8"
                    :color="area.color"
                  >
                    <span class="text-h6">{{ area.score }}%</span>
                  </v-progress-circular>
                  <h5 class="text-subtitle-1 mt-2">{{ area.name }}</h5>
                  <p class="text-caption text-grey">{{ area.status }}</p>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recommendations List -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h4 class="text-h6">Action Items</h4>
          <v-chip-group
            v-model="filterStatus"
            @update:model-value="filterRecommendations"
          >
            <v-chip
              value="all"
              variant="outlined"
              filter
            >
              All
            </v-chip>
            <v-chip
              value="pending"
              variant="outlined"
              filter
            >
              Pending
            </v-chip>
            <v-chip
              value="in_progress"
              variant="outlined"
              filter
            >
              In Progress
            </v-chip>
            <v-chip
              value="completed"
              variant="outlined"
              filter
            >
              Completed
            </v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="!loading && filteredRecommendations.length > 0">
      <v-col
        v-for="recommendation in filteredRecommendations"
        :key="recommendation.id"
        cols="12"
      >
        <v-card
          variant="outlined"
          :class="{
            'opacity-50': recommendation.status === 'completed'
          }"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-checkbox
                :model-value="recommendation.status === 'completed'"
                @update:model-value="toggleStatus(recommendation)"
                hide-details
              />
            </template>
            <v-card-title
              :class="{
                'text-decoration-line-through': recommendation.status === 'completed'
              }"
            >
              {{ recommendation.title }}
            </v-card-title>
            <v-card-subtitle>
              {{ recommendation.category }} • Due {{ formatDueDate(recommendation.dueDate) }}
            </v-card-subtitle>
            <template v-slot:append>
              <v-chip
                :color="getStatusColor(recommendation.status)"
                size="small"
                variant="tonal"
              >
                {{ recommendation.status }}
              </v-chip>
            </template>
          </v-card-item>

          <v-card-text>
            <p class="text-body-2 mb-3">{{ recommendation.description }}</p>
            
            <div v-if="recommendation.steps?.length > 0" class="mb-3">
              <h6 class="text-subtitle-2 mb-2">Implementation Steps:</h6>
              <v-list density="compact">
                <v-list-item
                  v-for="(step, index) in recommendation.steps"
                  :key="index"
                  class="pl-0"
                >
                  <template v-slot:prepend>
                    <v-icon
                      :color="step.completed ? 'success' : 'grey'"
                      size="16"
                    >
                      {{ step.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ step.text }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
            
            <div v-if="recommendation.impact" class="mb-3">
              <v-row dense>
                <v-col cols="4">
                  <div class="text-center">
                    <v-icon color="primary" size="20">mdi-trending-up</v-icon>
                    <p class="text-caption mb-0">Expected Growth</p>
                    <p class="text-subtitle-2 font-weight-bold">+{{ recommendation.impact.growth }}%</p>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <v-icon color="success" size="20">mdi-account-multiple</v-icon>
                    <p class="text-caption mb-0">Audience Reach</p>
                    <p class="text-subtitle-2 font-weight-bold">{{ formatNumber(recommendation.impact.reach) }}</p>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <v-icon color="warning" size="20">mdi-clock</v-icon>
                    <p class="text-caption mb-0">Time Required</p>
                    <p class="text-subtitle-2 font-weight-bold">{{ recommendation.impact.timeRequired }}</p>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              v-if="recommendation.status !== 'completed'"
              color="primary"
              variant="text"
              size="small"
              @click="startRecommendation(recommendation)"
            >
              {{ recommendation.status === 'in_progress' ? 'View Progress' : 'Start' }}
            </v-btn>
            <v-btn
              variant="text"
              size="small"
              @click="viewDetails(recommendation)"
            >
              Details
            </v-btn>
            <v-spacer />
            <v-btn
              icon
              size="small"
              variant="text"
              @click="deleteRecommendation(recommendation)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-else-if="loading">
      <v-col cols="12">
        <v-skeleton-loader
          v-for="i in 3"
          :key="i"
          :type="'card'"
          class="mb-4"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else>
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" class="mb-4 text-grey-lighten-1">mdi-clipboard-check-outline</v-icon>
            <h3 class="text-h5 mb-2">No Recommendations</h3>
            <p class="text-body-2 text-grey mb-4">
              Run a comprehensive analysis to get strategic recommendations
            </p>
            <v-btn color="primary" @click="$emit('refresh')">
              Generate Recommendations
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
interface Recommendation {
  id: string
  title: string
  description: string
  category: string
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: Date
  priority: 'high' | 'medium' | 'low'
  steps?: Array<{
    text: string
    completed: boolean
  }>
  impact?: {
    growth: number
    reach: number
    timeRequired: string
  }
}

interface Props {
  recommendations?: Recommendation[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recommendations: () => [],
  loading: false
})

const emit = defineEmits<{
  refresh: []
  'status-updated': [recommendation: Recommendation]
}>()

// Local state
const filterStatus = ref('all')
const focusAreas = ref([
  {
    name: 'Content Quality',
    score: 75,
    status: 'Good',
    color: 'success'
  },
  {
    name: 'Engagement Rate',
    score: 62,
    status: 'Needs Improvement',
    color: 'warning'
  },
  {
    name: 'Posting Frequency',
    score: 85,
    status: 'Excellent',
    color: 'primary'
  },
  {
    name: 'Audience Growth',
    score: 45,
    status: 'Focus Area',
    color: 'error'
  }
])

// Computed
const filteredRecommendations = computed(() => {
  if (filterStatus.value === 'all') {
    return props.recommendations
  }
  
  return props.recommendations.filter(r => r.status === filterStatus.value)
})

// Methods
const filterRecommendations = () => {
  // Filtering is handled by computed property
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    case 'pending': return 'grey'
    default: return 'grey'
  }
}

const formatDueDate = (date?: Date) => {
  if (!date) return 'No deadline'
  
  const dueDate = new Date(date)
  const today = new Date()
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `in ${diffDays} days`
  
  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const toggleStatus = async (recommendation: Recommendation) => {
  const newStatus = recommendation.status === 'completed' ? 'pending' : 'completed'
  
  try {
    await $fetch(`/api/admin/twitter/recommendations/${recommendation.id}`, {
      method: 'PATCH',
      body: {
        status: newStatus
      }
    })
    
    recommendation.status = newStatus
    emit('status-updated', recommendation)
  } catch (error: any) {
    useNuxtApp().$toast?.error('Failed to update status')
  }
}

const startRecommendation = (recommendation: Recommendation) => {
  if (recommendation.status === 'pending') {
    toggleStatus({ ...recommendation, status: 'in_progress' } as Recommendation)
  }
  
  // Navigate to implementation page
  navigateTo(`/admin/twitter/recommendations/${recommendation.id}`)
}

const viewDetails = (recommendation: Recommendation) => {
  // TODO: Implement details view
  console.log('View details:', recommendation)
}

const deleteRecommendation = async (recommendation: Recommendation) => {
  if (!confirm('Delete this recommendation?')) return
  
  try {
    await $fetch(`/api/admin/twitter/recommendations/${recommendation.id}`, {
      method: 'DELETE'
    })
    
    emit('refresh')
    useNuxtApp().$toast?.success('Recommendation deleted')
  } catch (error: any) {
    useNuxtApp().$toast?.error('Failed to delete recommendation')
  }
}
</script>