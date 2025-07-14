<template>
  <div>
    <div class="d-flex align-center justify-between mb-4">
      <h2 class="text-h5">Strategic Insights</h2>
      <v-btn
        color="primary"
        :loading="loading"
        @click="$emit('refresh')"
      >
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.type"
          :items="typeOptions"
          label="Insight Type"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.impact"
          :items="impactOptions"
          label="Impact Level"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.confidence"
          :items="confidenceOptions"
          label="Confidence"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-switch
          v-model="filters.actionableOnly"
          label="Actionable Only"
          density="compact"
        />
      </v-col>
    </v-row>

    <!-- Insights Grid -->
    <v-row>
      <v-col
        v-for="insight in filteredInsights"
        :key="insight.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card 
          :class="{
            'border-high': insight.impact === 'high',
            'border-medium': insight.impact === 'medium',
            'border-low': insight.impact === 'low'
          }"
          height="100%"
          @click="selectInsight(insight)"
        >
          <v-card-title class="d-flex align-center justify-between">
            <span class="text-subtitle-1">{{ insight.title }}</span>
            <div class="d-flex gap-1">
              <v-chip
                :color="getTypeColor(insight.insightType)"
                size="small"
                variant="outlined"
              >
                {{ formatType(insight.insightType) }}
              </v-chip>
              <v-chip
                :color="getImpactColor(insight.impact)"
                size="small"
              >
                {{ insight.impact }}
              </v-chip>
            </div>
          </v-card-title>

          <v-card-text>
            <p class="text-body-2 mb-3">
              {{ insight.description.substring(0, 150) }}...
            </p>

            <div class="d-flex align-center justify-between">
              <div class="d-flex align-center">
                <v-icon size="16" class="mr-1">mdi-target</v-icon>
                <span class="text-caption">
                  {{ Math.round(insight.confidence * 100) }}% confidence
                </span>
              </div>
              
              <div v-if="insight.competitor" class="d-flex align-center">
                <v-avatar size="20" class="mr-1">
                  <v-img
                    :src="`https://unavatar.io/twitter/${insight.competitor.username}`"
                    :alt="insight.competitor.username"
                  />
                </v-avatar>
                <span class="text-caption">@{{ insight.competitor.username }}</span>
              </div>
            </div>

            <!-- Confidence Bar -->
            <v-progress-linear
              :model-value="insight.confidence * 100"
              :color="getConfidenceColor(insight.confidence)"
              height="4"
              class="mt-2"
              rounded
            />
          </v-card-text>

          <v-card-actions v-if="insight.isActionable">
            <v-chip
              color="success"
              size="small"
              prepend-icon="mdi-check-circle"
            >
              Actionable
            </v-chip>
            <v-spacer />
            <v-btn
              size="small"
              variant="text"
              @click.stop="viewRecommendation(insight)"
            >
              View Actions
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- No insights message -->
    <v-card v-if="filteredInsights.length === 0 && !loading" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-lightbulb-outline</v-icon>
      <h3 class="text-h6 mt-4 mb-2">No Insights Available</h3>
      <p class="text-body-2 text-grey">
        Run competitor analysis to generate strategic insights
      </p>
    </v-card>

    <!-- Insight Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="800" scrollable>
      <v-card v-if="selectedInsight">
        <v-card-title class="d-flex align-center justify-between">
          <span>{{ selectedInsight.title }}</span>
          <v-btn icon @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <!-- Header Info -->
          <div class="d-flex gap-2 mb-4">
            <v-chip
              :color="getTypeColor(selectedInsight.insightType)"
              variant="outlined"
            >
              {{ formatType(selectedInsight.insightType) }}
            </v-chip>
            <v-chip :color="getImpactColor(selectedInsight.impact)">
              {{ selectedInsight.impact }} impact
            </v-chip>
            <v-chip color="primary" variant="outlined">
              {{ Math.round(selectedInsight.confidence * 100) }}% confidence
            </v-chip>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <h4 class="text-h6 mb-2">Description</h4>
            <p class="text-body-1">{{ selectedInsight.description }}</p>
          </div>

          <!-- Recommendation -->
          <div class="mb-4">
            <h4 class="text-h6 mb-2">Recommendation</h4>
            <p class="text-body-1">{{ selectedInsight.recommendation }}</p>
          </div>

          <!-- Actionable Steps -->
          <div v-if="selectedInsight.supportingData?.actionable_steps" class="mb-4">
            <h4 class="text-h6 mb-2">Action Steps</h4>
            <v-list density="compact">
              <v-list-item
                v-for="(step, index) in selectedInsight.supportingData.actionable_steps"
                :key="index"
                :title="`${index + 1}. ${step}`"
                prepend-icon="mdi-chevron-right"
              />
            </v-list>
          </div>

          <!-- Related Competitors -->
          <div v-if="selectedInsight.supportingData?.competitors_involved" class="mb-4">
            <h4 class="text-h6 mb-2">Based on Analysis of</h4>
            <div class="d-flex gap-2 flex-wrap">
              <v-chip
                v-for="username in selectedInsight.supportingData.competitors_involved"
                :key="username"
                variant="outlined"
                prepend-icon="mdi-twitter"
              >
                @{{ username }}
              </v-chip>
            </div>
          </div>

          <!-- Metadata -->
          <div class="d-flex justify-between text-caption text-grey">
            <span>Generated: {{ formatDate(selectedInsight.createdAt) }}</span>
            <span v-if="selectedInsight.competitor">
              From: @{{ selectedInsight.competitor.username }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn
            v-if="selectedInsight.isActionable"
            color="primary"
            @click="implementInsight(selectedInsight)"
          >
            <v-icon start>mdi-rocket-launch</v-icon>
            Implement
          </v-btn>
          <v-spacer />
          <v-btn @click="shareInsight(selectedInsight)">
            <v-icon start>mdi-share</v-icon>
            Share
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Insight {
  id: string
  title: string
  description: string
  insightType: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  recommendation: string
  isActionable: boolean
  createdAt: string
  competitor?: {
    id: string
    username: string
    name: string
  }
  supportingData?: {
    actionable_steps?: string[]
    competitors_involved?: string[]
  }
}

const props = defineProps<{
  insights: Insight[]
  loading?: boolean
}>()

defineEmits<{
  refresh: []
}>()

// Reactive data
const showDetailsDialog = ref(false)
const selectedInsight = ref<Insight | null>(null)

const filters = ref({
  type: '',
  impact: '',
  confidence: '',
  actionableOnly: false
})

// Static data
const typeOptions = [
  { title: 'Content Strategy', value: 'content_strategy' },
  { title: 'Posting Pattern', value: 'posting_pattern' },
  { title: 'Engagement Tactics', value: 'engagement_tactics' },
  { title: 'Audience Building', value: 'audience_building' },
  { title: 'Viral Content', value: 'viral_content' }
]

const impactOptions = [
  { title: 'High Impact', value: 'high' },
  { title: 'Medium Impact', value: 'medium' },
  { title: 'Low Impact', value: 'low' }
]

const confidenceOptions = [
  { title: 'High Confidence (80%+)', value: 'high' },
  { title: 'Medium Confidence (60-80%)', value: 'medium' },
  { title: 'Low Confidence (<60%)', value: 'low' }
]

// Computed
const filteredInsights = computed(() => {
  let filtered = [...props.insights]

  if (filters.value.type) {
    filtered = filtered.filter(i => i.insightType === filters.value.type)
  }

  if (filters.value.impact) {
    filtered = filtered.filter(i => i.impact === filters.value.impact)
  }

  if (filters.value.confidence) {
    const threshold = filters.value.confidence === 'high' ? 0.8 :
                     filters.value.confidence === 'medium' ? 0.6 : 0
    const maxThreshold = filters.value.confidence === 'medium' ? 0.8 : 1

    filtered = filtered.filter(i => 
      i.confidence >= threshold && i.confidence < maxThreshold
    )
  }

  if (filters.value.actionableOnly) {
    filtered = filtered.filter(i => i.isActionable)
  }

  return filtered.sort((a, b) => {
    // Sort by impact, then confidence
    const impactOrder = { high: 3, medium: 2, low: 1 }
    const impactDiff = impactOrder[b.impact] - impactOrder[a.impact]
    if (impactDiff !== 0) return impactDiff
    return b.confidence - a.confidence
  })
})

// Methods
const getTypeColor = (type: string) => {
  switch (type) {
    case 'content_strategy': return 'primary'
    case 'posting_pattern': return 'success'
    case 'engagement_tactics': return 'warning'
    case 'audience_building': return 'info'
    case 'viral_content': return 'purple'
    default: return 'grey'
  }
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'grey'
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'error'
}

const formatType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const selectInsight = (insight: Insight) => {
  selectedInsight.value = insight
  showDetailsDialog.value = true
}

const viewRecommendation = (insight: Insight) => {
  selectInsight(insight)
}

const implementInsight = (insight: Insight) => {
  // In a real app, this would create tasks or strategy items
  useNuxtApp().$toast?.success('Implementation plan created!')
  showDetailsDialog.value = false
}

const shareInsight = (insight: Insight) => {
  // Simple sharing - in real app, use proper sharing API
  const shareText = `Strategic Insight: ${insight.title}\n\n${insight.recommendation}`
  
  if (navigator.share) {
    navigator.share({
      title: insight.title,
      text: shareText
    })
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(shareText)
    useNuxtApp().$toast?.success('Insight copied to clipboard')
  }
}
</script>

<style scoped>
.border-high {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.border-medium {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.border-low {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.v-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>