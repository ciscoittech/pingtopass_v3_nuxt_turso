<template>
  <div>
    <!-- Performance Overview -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h3 class="text-h6 mb-4">Performance Overview</h3>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <v-icon size="48" color="primary" class="mb-3">mdi-trending-up</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ recentAnalysis?.analyzed_competitors || 0 }}</h3>
            <p class="text-body-2 text-grey">Competitors Analyzed</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <v-icon size="48" color="success" class="mb-3">mdi-lightbulb</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ recentAnalysis?.insights_generated || 0 }}</h3>
            <p class="text-body-2 text-grey">Insights Generated</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <v-icon size="48" color="warning" class="mb-3">mdi-chart-line</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ recentAnalysis?.trends_identified || 0 }}</h3>
            <p class="text-body-2 text-grey">Trends Identified</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Competitive Benchmarks -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h3 class="text-h6 mb-4">Competitive Benchmarks</h3>
        <v-card variant="outlined">
          <v-card-text>
            <v-table v-if="benchmarks.length > 0">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Your Performance</th>
                  <th>Industry Average</th>
                  <th>Top Performer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="benchmark in benchmarks" :key="benchmark.metric">
                  <td>{{ benchmark.metric }}</td>
                  <td>{{ formatMetric(benchmark.yourValue, benchmark.type) }}</td>
                  <td>{{ formatMetric(benchmark.industryAvg, benchmark.type) }}</td>
                  <td>{{ formatMetric(benchmark.topPerformer, benchmark.type) }}</td>
                  <td>
                    <v-chip
                      :color="getBenchmarkColor(benchmark.yourValue, benchmark.industryAvg)"
                      size="small"
                      variant="tonal"
                    >
                      {{ getBenchmarkStatus(benchmark.yourValue, benchmark.industryAvg) }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-8">
              <v-icon size="48" class="mb-3 text-grey-lighten-1">mdi-chart-bar</v-icon>
              <p class="text-body-2 text-grey">Run analysis to see benchmarks</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity Timeline -->
    <v-row>
      <v-col cols="12">
        <h3 class="text-h6 mb-4">Recent Activity</h3>
        <v-card variant="outlined">
          <v-card-text>
            <v-timeline v-if="recentAnalysis?.timeline?.length > 0" side="end" density="compact">
              <v-timeline-item
                v-for="(item, index) in recentAnalysis.timeline.slice(0, 5)"
                :key="index"
                :dot-color="getTimelineColor(item.type)"
                size="small"
              >
                <template v-slot:opposite>
                  <span class="text-caption">{{ formatTimeAgo(item.timestamp) }}</span>
                </template>
                <div>
                  <strong>{{ item.title }}</strong>
                  <div class="text-body-2 text-grey">{{ item.description }}</div>
                </div>
              </v-timeline-item>
            </v-timeline>
            <div v-else class="text-center py-8">
              <v-icon size="48" class="mb-3 text-grey-lighten-1">mdi-timeline</v-icon>
              <p class="text-body-2 text-grey">No recent activity</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
interface Props {
  recentAnalysis?: any
  benchmarks?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  benchmarks: () => []
})

const emit = defineEmits<{
  refresh: []
}>()

// Format metric based on type
const formatMetric = (value: number, type: string) => {
  if (!value) return 'N/A'
  
  switch (type) {
    case 'percentage':
      return `${value}%`
    case 'number':
      return value.toLocaleString()
    case 'currency':
      return `$${value.toLocaleString()}`
    default:
      return value
  }
}

// Get benchmark status color
const getBenchmarkColor = (yourValue: number, industryAvg: number) => {
  if (!yourValue || !industryAvg) return 'grey'
  
  const ratio = yourValue / industryAvg
  if (ratio >= 1.2) return 'success'
  if (ratio >= 0.8) return 'warning'
  return 'error'
}

// Get benchmark status text
const getBenchmarkStatus = (yourValue: number, industryAvg: number) => {
  if (!yourValue || !industryAvg) return 'No Data'
  
  const ratio = yourValue / industryAvg
  if (ratio >= 1.2) return 'Above Average'
  if (ratio >= 0.8) return 'Average'
  return 'Below Average'
}

// Get timeline item color
const getTimelineColor = (type: string) => {
  switch (type) {
    case 'analysis': return 'primary'
    case 'insight': return 'success'
    case 'trend': return 'warning'
    case 'alert': return 'error'
    default: return 'grey'
  }
}

// Format time ago
const formatTimeAgo = (timestamp: string | Date) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${minutes}m ago`
}

// Refresh data
const refresh = () => {
  emit('refresh')
}

// Auto-refresh every 5 minutes
onMounted(() => {
  const interval = setInterval(refresh, 5 * 60 * 1000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>