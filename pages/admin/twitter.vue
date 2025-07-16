<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Twitter Intelligence</h1>
            <p class="text-subtitle-1 text-grey">
              Monitor competitors, analyze trends, and optimize content strategy
            </p>
          </div>
          <v-btn
            color="primary"
            :loading="isAnalyzing"
            @click="runAnalysis"
          >
            <v-icon start>mdi-radar</v-icon>
            Run Analysis
          </v-btn>
        </div>
      </v-col>
    </v-row>

      <!-- Quick Stats -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center justify-between">
                <div>
                  <h3 class="text-h6">{{ stats.competitors || 0 }}</h3>
                  <p class="text-caption text-grey">Active Competitors</p>
                </div>
                <v-icon color="primary" size="40">mdi-account-group</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center justify-between">
                <div>
                  <h3 class="text-h6">{{ stats.insights || 0 }}</h3>
                  <p class="text-caption text-grey">Recent Insights</p>
                </div>
                <v-icon color="success" size="40">mdi-lightbulb</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center justify-between">
                <div>
                  <h3 class="text-h6">{{ stats.trending || 0 }}</h3>
                  <p class="text-caption text-grey">Trending Topics</p>
                </div>
                <v-icon color="warning" size="40">mdi-trending-up</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center justify-between">
                <div>
                  <h3 class="text-h6">{{ stats.recommendations || 0 }}</h3>
                  <p class="text-caption text-grey">Action Items</p>
                </div>
                <v-icon color="info" size="40">mdi-clipboard-check</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content Tabs -->
      <v-card>
        <v-tabs v-model="activeTab" bg-color="transparent">
          <v-tab value="overview">Overview</v-tab>
          <v-tab value="competitors">Competitors</v-tab>
          <v-tab value="insights">Insights</v-tab>
          <v-tab value="trends">Trends</v-tab>
          <v-tab value="recommendations">Strategy</v-tab>
        </v-tabs>

        <v-card-text>
          <v-tabs-window v-model="activeTab">
            <!-- Overview Tab -->
            <v-tabs-window-item value="overview">
              <TwitterOverview 
                :recent-analysis="recentAnalysis"
                :benchmarks="benchmarks"
                @refresh="loadDashboardData"
              />
            </v-tabs-window-item>

            <!-- Competitors Tab -->
            <v-tabs-window-item value="competitors">
              <TwitterCompetitors 
                :competitors="competitors"
                @competitor-added="loadCompetitors"
                @competitor-updated="loadCompetitors"
                @analysis-started="isAnalyzing = true"
                @analysis-completed="handleAnalysisComplete"
              />
            </v-tabs-window-item>

            <!-- Insights Tab -->
            <v-tabs-window-item value="insights">
              <TwitterInsights 
                :insights="insights"
                :loading="loadingInsights"
                @refresh="loadInsights"
              />
            </v-tabs-window-item>

            <!-- Trends Tab -->
            <v-tabs-window-item value="trends">
              <TwitterTrends 
                :trends="trends"
                :content-opportunities="contentOpportunities"
                :loading="loadingTrends"
                @refresh="loadTrends"
              />
            </v-tabs-window-item>

            <!-- Recommendations Tab -->
            <v-tabs-window-item value="recommendations">
              <TwitterRecommendations 
                :recommendations="recommendations"
                :loading="loadingRecommendations"
                @refresh="loadRecommendations"
                @status-updated="loadRecommendations"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import TwitterOverview from '@/components/admin/twitter/TwitterOverview.vue'
import TwitterCompetitors from '@/components/admin/twitter/TwitterCompetitors.vue'
import TwitterInsights from '@/components/admin/twitter/TwitterInsights.vue'
import TwitterTrends from '@/components/admin/twitter/TwitterTrends.vue'
import TwitterRecommendations from '@/components/admin/twitter/TwitterRecommendations.vue'

definePageMeta({
  title: 'Twitter Intelligence',
  requiresAuth: true,
  layout: 'admin',
  middleware: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Twitter Intelligence' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Twitter Intelligence',
    disabled: true,
    to: ''
  }
])

// Reactive data
const activeTab = ref('overview')
const isAnalyzing = ref(false)
const loadingInsights = ref(false)
const loadingTrends = ref(false)
const loadingRecommendations = ref(false)

const competitors = ref<any[]>([])
const insights = ref<any[]>([])
const trends = ref<any[]>([])
const recommendations = ref<any[]>([])
const contentOpportunities = ref<any>(null)
const recentAnalysis = ref<any>(null)
const benchmarks = ref<any[]>([])

// Computed stats
const stats = computed(() => ({
  competitors: competitors.value.filter(c => c.isActive).length,
  insights: insights.value.filter(i => 
    new Date(i.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length,
  trending: trends.value.filter(t => t.relevanceScore > 0.6).length,
  recommendations: recommendations.value.filter(r => r.status === 'pending').length
}))

// Methods
const loadDashboardData = async () => {
  await Promise.all([
    loadCompetitors(),
    loadInsights(),
    loadTrends(),
    loadRecommendations()
  ])
}

const loadCompetitors = async () => {
  try {
    const { data } = await $fetch('/api/admin/twitter/competitors')
    competitors.value = data.competitors || []
  } catch (error) {
    console.error('Failed to load competitors:', error)
    useNuxtApp().$toast?.error('Failed to load competitors')
  }
}

const loadInsights = async () => {
  loadingInsights.value = true
  try {
    const { data } = await $fetch('/api/admin/twitter/insights', {
      params: { limit: 50, includeRecommendations: false }
    })
    insights.value = data.insights || []
  } catch (error) {
    console.error('Failed to load insights:', error)
    useNuxtApp().$toast?.error('Failed to load insights')
  } finally {
    loadingInsights.value = false
  }
}

const loadTrends = async () => {
  loadingTrends.value = true
  try {
    const { data } = await $fetch('/api/admin/twitter/trends', {
      params: { includeOpportunities: true }
    })
    trends.value = data.relevant_trends || []
    contentOpportunities.value = data.content_opportunities
  } catch (error) {
    console.error('Failed to load trends:', error)
    useNuxtApp().$toast?.error('Failed to load trends')
  } finally {
    loadingTrends.value = false
  }
}

const loadRecommendations = async () => {
  loadingRecommendations.value = true
  try {
    const { data } = await $fetch('/api/admin/twitter/insights', {
      params: { includeRecommendations: true, limit: 10 }
    })
    recommendations.value = data.recommendations || []
  } catch (error) {
    console.error('Failed to load recommendations:', error)
    useNuxtApp().$toast?.error('Failed to load recommendations')
  } finally {
    loadingRecommendations.value = false
  }
}

const runAnalysis = async () => {
  if (competitors.value.length === 0) {
    useNuxtApp().$toast?.error('Add competitors before running analysis')
    activeTab.value = 'competitors'
    return
  }

  isAnalyzing.value = true
  
  try {
    const activeCompetitorIds = competitors.value
      .filter(c => c.isActive)
      .map(c => c.id)
      .slice(0, 5) // Limit to 5 for performance

    if (activeCompetitorIds.length === 0) {
      throw new Error('No active competitors found')
    }

    const { data } = await $fetch('/api/admin/twitter/analyze', {
      method: 'POST',
      body: {
        competitorIds: activeCompetitorIds,
        includeRecommendations: true
      }
    })

    recentAnalysis.value = data
    benchmarks.value = data.benchmarks || []
    
    useNuxtApp().$toast?.success(
      `Analysis complete: ${data.analyzed_competitors} competitors, ${data.insights_generated} insights`
    )
    
    // Refresh all data
    await loadDashboardData()

  } catch (error: any) {
    console.error('Analysis failed:', error)
    useNuxtApp().$toast?.error(error.data?.message || 'Analysis failed')
  } finally {
    isAnalyzing.value = false
  }
}

const handleAnalysisComplete = (data: any) => {
  recentAnalysis.value = data
  benchmarks.value = data.benchmarks || []
  isAnalyzing.value = false
  loadDashboardData()
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.v-tabs {
  border-bottom: 1px solid rgba(0,0,0,0.12);
}
</style>