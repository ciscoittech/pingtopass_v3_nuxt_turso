<template>
  <div>
    <!-- Insights Filter -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="filterType"
          label="Insight Type"
          :items="insightTypes"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="filterPriority"
          label="Priority"
          :items="priorities"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="Search insights..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          clearable
        />
      </v-col>
    </v-row>

    <!-- Insights List -->
    <v-row v-if="!loading && filteredInsights.length > 0">
      <v-col
        v-for="insight in filteredInsights"
        :key="insight.id"
        cols="12"
      >
        <v-card
          variant="outlined"
          :class="{
            'border-error': insight.priority === 'high',
            'border-warning': insight.priority === 'medium'
          }"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar
                :color="getInsightColor(insight.type)"
                variant="tonal"
              >
                <v-icon>{{ getInsightIcon(insight.type) }}</v-icon>
              </v-avatar>
            </template>
            <v-card-title>{{ insight.title }}</v-card-title>
            <v-card-subtitle>
              {{ insight.competitor }} • {{ formatDate(insight.createdAt) }}
            </v-card-subtitle>
            <template v-slot:append>
              <v-chip
                :color="getPriorityColor(insight.priority)"
                size="small"
                variant="tonal"
              >
                {{ insight.priority }}
              </v-chip>
            </template>
          </v-card-item>

          <v-card-text>
            <p class="text-body-2 mb-3">{{ insight.description }}</p>
            
            <div v-if="insight.metrics" class="mb-3">
              <v-chip-group>
                <v-chip
                  v-for="(value, key) in insight.metrics"
                  :key="key"
                  size="small"
                  variant="outlined"
                >
                  {{ key }}: {{ formatMetricValue(value) }}
                </v-chip>
              </v-chip-group>
            </div>

            <div v-if="insight.recommendations?.length > 0">
              <h5 class="text-subtitle-2 mb-2">Recommendations:</h5>
              <ul class="text-body-2">
                <li
                  v-for="(rec, index) in insight.recommendations"
                  :key="index"
                  class="mb-1"
                >
                  {{ rec }}
                </li>
              </ul>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              @click="applyInsight(insight)"
            >
              Apply Insight
            </v-btn>
            <v-btn
              variant="text"
              size="small"
              @click="dismissInsight(insight)"
            >
              Dismiss
            </v-btn>
            <v-spacer />
            <v-btn
              icon
              size="small"
              variant="text"
              @click="shareInsight(insight)"
            >
              <v-icon>mdi-share-variant</v-icon>
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
          type="card"
          class="mb-4"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else>
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" class="mb-4 text-grey-lighten-1">mdi-lightbulb-outline</v-icon>
            <h3 class="text-h5 mb-2">No Insights Available</h3>
            <p class="text-body-2 text-grey mb-4">
              Run an analysis to generate insights from competitor data
            </p>
            <v-btn color="primary" @click="$emit('refresh')">
              Refresh Insights
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
interface Insight {
  id: string
  type: string
  title: string
  description: string
  competitor: string
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
  metrics?: Record<string, any>
  recommendations?: string[]
  applied?: boolean
  dismissed?: boolean
}

interface Props {
  insights?: Insight[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  insights: () => [],
  loading: false
})

const emit = defineEmits<{
  refresh: []
}>()

// Local state
const filterType = ref('')
const filterPriority = ref('')
const searchQuery = ref('')

const insightTypes = [
  'Content Performance',
  'Engagement Pattern',
  'Posting Strategy',
  'Audience Growth',
  'Trending Topics',
  'Competitive Gap'
]

const priorities = [
  { title: 'High Priority', value: 'high' },
  { title: 'Medium Priority', value: 'medium' },
  { title: 'Low Priority', value: 'low' }
]

// Computed
const filteredInsights = computed(() => {
  let filtered = props.insights.filter(i => !i.dismissed)
  
  if (filterType.value) {
    filtered = filtered.filter(i => i.type === filterType.value)
  }
  
  if (filterPriority.value) {
    filtered = filtered.filter(i => i.priority === filterPriority.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.competitor.toLowerCase().includes(query)
    )
  }
  
  // Sort by priority and date
  return filtered.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    
    if (priorityDiff !== 0) return priorityDiff
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// Methods
const getInsightColor = (type: string) => {
  switch (type) {
    case 'Content Performance': return 'primary'
    case 'Engagement Pattern': return 'success'
    case 'Posting Strategy': return 'info'
    case 'Audience Growth': return 'warning'
    case 'Trending Topics': return 'error'
    default: return 'grey'
  }
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'Content Performance': return 'mdi-chart-line'
    case 'Engagement Pattern': return 'mdi-heart'
    case 'Posting Strategy': return 'mdi-calendar'
    case 'Audience Growth': return 'mdi-account-multiple'
    case 'Trending Topics': return 'mdi-fire'
    default: return 'mdi-lightbulb'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'grey'
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMetricValue = (value: any) => {
  if (typeof value === 'number') {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return value.toFixed(1)
  }
  return value
}

const applyInsight = async (insight: Insight) => {
  try {
    await $fetch(`/api/admin/twitter/insights/${insight.id}/apply`, {
      method: 'POST'
    })
    
    insight.applied = true
    useNuxtApp().$toast?.success('Insight applied successfully')
  } catch (error: any) {
    useNuxtApp().$toast?.error('Failed to apply insight')
  }
}

const dismissInsight = async (insight: Insight) => {
  try {
    await $fetch(`/api/admin/twitter/insights/${insight.id}/dismiss`, {
      method: 'POST'
    })
    
    insight.dismissed = true
    useNuxtApp().$toast?.info('Insight dismissed')
  } catch (error: any) {
    useNuxtApp().$toast?.error('Failed to dismiss insight')
  }
}

const shareInsight = (insight: Insight) => {
  // TODO: Implement sharing functionality
  console.log('Share insight:', insight)
}
</script>