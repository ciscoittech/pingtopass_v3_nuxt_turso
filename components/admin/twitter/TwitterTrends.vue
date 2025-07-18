<template>
  <div>
    <!-- Trending Topics -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h4 class="text-h6 mb-4">Trending Topics</h4>
      </v-col>
      <v-col
        v-for="trend in topTrends"
        :key="trend.id"
        cols="12"
        md="6"
        lg="3"
      >
        <v-card
          variant="outlined"
          class="h-100"
          :class="{ 'border-primary': trend.relevanceScore > 0.8 }"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <v-chip
                :color="getTrendColor(trend.growth)"
                size="small"
                variant="tonal"
              >
                <v-icon start size="16">{{ getTrendIcon(trend.growth) }}</v-icon>
                {{ formatGrowth(trend.growth) }}
              </v-chip>
              <v-icon
                v-if="trend.relevanceScore > 0.8"
                color="warning"
                size="20"
              >
                mdi-fire
              </v-icon>
            </div>
            
            <h5 class="text-subtitle-1 font-weight-bold mb-1">
              #{{ trend.hashtag }}
            </h5>
            
            <p class="text-body-2 text-grey mb-3">
              {{ trend.description }}
            </p>
            
            <div class="d-flex justify-space-between align-center">
              <span class="text-caption">
                {{ formatNumber(trend.volume) }} posts
              </span>
              <v-progress-circular
                :model-value="trend.relevanceScore * 100"
                :size="30"
                :width="3"
                :color="getRelevanceColor(trend.relevanceScore)"
              >
                <span class="text-caption">{{ Math.round(trend.relevanceScore * 100) }}</span>
              </v-progress-circular>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              block
              @click="createContent(trend)"
            >
              Create Content
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Content Opportunities -->
    <v-row v-if="contentOpportunities">
      <v-col cols="12">
        <h4 class="text-h6 mb-4">Content Opportunities</h4>
        <v-card variant="outlined">
          <v-card-text>
            <v-row>
              <v-col
                v-for="(opportunity, index) in contentOpportunities.opportunities"
                :key="index"
                cols="12"
                md="6"
              >
                <v-card variant="tonal" color="primary" class="mb-3">
                  <v-card-item>
                    <template v-slot:prepend>
                      <v-icon>{{ getOpportunityIcon(opportunity.type) }}</v-icon>
                    </template>
                    <v-card-title class="text-h6">
                      {{ opportunity.topic }}
                    </v-card-title>
                    <v-card-subtitle>
                      {{ opportunity.type }}
                    </v-card-subtitle>
                  </v-card-item>
                  
                  <v-card-text>
                    <p class="text-body-2 mb-3">{{ opportunity.rationale }}</p>
                    
                    <div class="mb-3">
                      <h6 class="text-subtitle-2 mb-1">Suggested Approach:</h6>
                      <ul class="text-body-2 pl-4">
                        <li
                          v-for="(approach, i) in opportunity.suggestedApproaches"
                          :key="i"
                        >
                          {{ approach }}
                        </li>
                      </ul>
                    </div>
                    
                    <v-chip-group>
                      <v-chip
                        v-for="keyword in opportunity.keywords"
                        :key="keyword"
                        size="small"
                        variant="outlined"
                      >
                        {{ keyword }}
                      </v-chip>
                    </v-chip-group>
                  </v-card-text>
                  
                  <v-card-actions>
                    <v-spacer />
                    <v-chip
                      :color="getPotentialColor(opportunity.potentialImpact)"
                      size="small"
                      variant="tonal"
                    >
                      {{ opportunity.potentialImpact }} Impact
                    </v-chip>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12">
        <v-skeleton-loader :type="'card'" />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="trends.length === 0">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" class="mb-4 text-grey-lighten-1">mdi-trending-up</v-icon>
            <h3 class="text-h5 mb-2">No Trends Available</h3>
            <p class="text-body-2 text-grey mb-4">
              Run an analysis to discover trending topics and content opportunities
            </p>
            <v-btn color="primary" @click="$emit('refresh')">
              Analyze Trends
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
interface Trend {
  id: string
  hashtag: string
  description: string
  volume: number
  growth: number
  relevanceScore: number
  category?: string
}

interface ContentOpportunity {
  opportunities: Array<{
    topic: string
    type: string
    rationale: string
    keywords: string[]
    suggestedApproaches: string[]
    potentialImpact: 'high' | 'medium' | 'low'
  }>
}

interface Props {
  trends?: Trend[]
  contentOpportunities?: ContentOpportunity | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trends: () => [],
  contentOpportunities: null,
  loading: false
})

const emit = defineEmits<{
  refresh: []
}>()

// Computed
const topTrends = computed(() => {
  return props.trends
    .slice()
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8)
})

// Methods
const getTrendColor = (growth: number) => {
  if (growth > 50) return 'success'
  if (growth > 20) return 'warning'
  if (growth > 0) return 'info'
  return 'error'
}

const getTrendIcon = (growth: number) => {
  if (growth > 0) return 'mdi-trending-up'
  if (growth < 0) return 'mdi-trending-down'
  return 'mdi-trending-neutral'
}

const formatGrowth = (growth: number) => {
  const sign = growth > 0 ? '+' : ''
  return `${sign}${growth}%`
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

const getRelevanceColor = (score: number) => {
  if (score > 0.8) return 'success'
  if (score > 0.6) return 'warning'
  if (score > 0.4) return 'info'
  return 'grey'
}

const getOpportunityIcon = (type: string) => {
  switch (type) {
    case 'Educational': return 'mdi-school'
    case 'Engagement': return 'mdi-heart'
    case 'News': return 'mdi-newspaper'
    case 'Tutorial': return 'mdi-book-open'
    default: return 'mdi-lightbulb'
  }
}

const getPotentialColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'success'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'grey'
  }
}

const createContent = (trend: Trend) => {
  // TODO: Implement content creation
  console.log('Create content for trend:', trend)
  navigateTo(`/admin/twitter/content?trend=${trend.hashtag}`)
}
</script>