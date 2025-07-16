import { defineStore } from 'pinia'

// Twitter Intelligence State Management
interface TwitterCompetitor {
  id: string
  username: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'paused' | 'error'
  last_analyzed: string
  metrics?: {
    followers: number
    engagement_rate: number
    posting_frequency: number
  }
  created_at: string
  updated_at: string
}

interface TwitterInsight {
  id: string
  type: 'content_strategy' | 'posting_patterns' | 'engagement_tactics' | 'trending_topics'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  recommendation: string
  actionable_steps: string[]
  competitors_involved: string[]
  created_at: string
}

interface TwitterTrend {
  tag: string
  volume: number
  category: string
  growth: number
  sentiment: 'positive' | 'neutral' | 'negative'
  opportunity_score: number
}

interface TwitterRecommendation {
  id: string
  category: 'content' | 'timing' | 'engagement' | 'hashtags'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  expected_impact: string
  implementation_steps: string[]
  success_metrics: string[]
  timeline: string
  budget_required: 'none' | 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

interface TwitterAnalysisJob {
  id: string
  competitors: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  started_at?: string
  completed_at?: string
  total_cost: number
  include_recommendations: boolean
  error_message?: string
}

interface TwitterOverviewData {
  analyzed_competitors: number
  insights_generated: number
  trends_identified: number
  last_updated: string
}

interface TwitterFilters {
  competitors: {
    search: string
    category: string
    priority: string
    status: string
  }
  insights: {
    type: string
    confidence_min: number
    impact: string
    search: string
  }
  trends: {
    category: string
    min_volume: number
    sentiment: string
    sort_by: 'volume' | 'growth' | 'opportunity_score'
  }
  recommendations: {
    category: string
    priority: string
    status: string
    effort: string
  }
}

interface TwitterState {
  // Data
  competitors: TwitterCompetitor[]
  insights: TwitterInsight[]
  trends: TwitterTrend[]
  recommendations: TwitterRecommendation[]
  overview: TwitterOverviewData | null
  currentAnalysisJob: TwitterAnalysisJob | null
  
  // UI State
  loading: {
    competitors: boolean
    insights: boolean
    trends: boolean
    recommendations: boolean
    overview: boolean
    analysis: boolean
  }
  
  // Error handling
  errors: {
    competitors: string | null
    insights: string | null
    trends: string | null
    recommendations: string | null
    overview: string | null
    analysis: string | null
  }
  
  // Filters and pagination
  filters: TwitterFilters
  pagination: {
    competitors: { page: number; limit: number; total: number }
    insights: { page: number; limit: number; total: number }
    recommendations: { page: number; limit: number; total: number }
  }
  
  // Settings
  settings: {
    auto_refresh: boolean
    refresh_interval: number // minutes
    enable_notifications: boolean
    analysis_frequency: 'daily' | 'weekly' | 'monthly'
  }
}

export const useTwitterStore = defineStore('twitter', {
  state: (): TwitterState => ({
    // Data
    competitors: [],
    insights: [],
    trends: [],
    recommendations: [],
    overview: null,
    currentAnalysisJob: null,
    
    // UI State
    loading: {
      competitors: false,
      insights: false,
      trends: false,
      recommendations: false,
      overview: false,
      analysis: false
    },
    
    // Error handling
    errors: {
      competitors: null,
      insights: null,
      trends: null,
      recommendations: null,
      overview: null,
      analysis: null
    },
    
    // Filters and pagination
    filters: {
      competitors: {
        search: '',
        category: 'all',
        priority: 'all',
        status: 'all'
      },
      insights: {
        type: 'all',
        confidence_min: 0,
        impact: 'all',
        search: ''
      },
      trends: {
        category: 'all',
        min_volume: 0,
        sentiment: 'all',
        sort_by: 'opportunity_score'
      },
      recommendations: {
        category: 'all',
        priority: 'all',
        status: 'all',
        effort: 'all'
      }
    },
    
    pagination: {
      competitors: { page: 1, limit: 20, total: 0 },
      insights: { page: 1, limit: 15, total: 0 },
      recommendations: { page: 1, limit: 10, total: 0 }
    },
    
    // Settings
    settings: {
      auto_refresh: true,
      refresh_interval: 15,
      enable_notifications: true,
      analysis_frequency: 'daily'
    }
  }),

  getters: {
    // Filtered competitors
    filteredCompetitors: (state) => {
      let filtered = state.competitors
      
      if (state.filters.competitors.search) {
        filtered = filtered.filter(comp => 
          comp.username.toLowerCase().includes(state.filters.competitors.search.toLowerCase())
        )
      }
      
      if (state.filters.competitors.category !== 'all') {
        filtered = filtered.filter(comp => comp.category === state.filters.competitors.category)
      }
      
      if (state.filters.competitors.priority !== 'all') {
        filtered = filtered.filter(comp => comp.priority === state.filters.competitors.priority)
      }
      
      if (state.filters.competitors.status !== 'all') {
        filtered = filtered.filter(comp => comp.status === state.filters.competitors.status)
      }
      
      return filtered
    },

    // Filtered insights
    filteredInsights: (state) => {
      let filtered = state.insights
      
      if (state.filters.insights.type !== 'all') {
        filtered = filtered.filter(insight => insight.type === state.filters.insights.type)
      }
      
      if (state.filters.insights.confidence_min > 0) {
        filtered = filtered.filter(insight => insight.confidence >= state.filters.insights.confidence_min)
      }
      
      if (state.filters.insights.impact !== 'all') {
        filtered = filtered.filter(insight => insight.impact === state.filters.insights.impact)
      }
      
      if (state.filters.insights.search) {
        filtered = filtered.filter(insight => 
          insight.title.toLowerCase().includes(state.filters.insights.search.toLowerCase()) ||
          insight.description.toLowerCase().includes(state.filters.insights.search.toLowerCase())
        )
      }
      
      return filtered.sort((a, b) => b.confidence - a.confidence)
    },

    // Sorted trends
    sortedTrends: (state) => {
      let sorted = [...state.trends]
      
      if (state.filters.trends.category !== 'all') {
        sorted = sorted.filter(trend => trend.category === state.filters.trends.category)
      }
      
      if (state.filters.trends.min_volume > 0) {
        sorted = sorted.filter(trend => trend.volume >= state.filters.trends.min_volume)
      }
      
      if (state.filters.trends.sentiment !== 'all') {
        sorted = sorted.filter(trend => trend.sentiment === state.filters.trends.sentiment)
      }
      
      // Sort by selected criteria
      switch (state.filters.trends.sort_by) {
        case 'volume':
          return sorted.sort((a, b) => b.volume - a.volume)
        case 'growth':
          return sorted.sort((a, b) => b.growth - a.growth)
        case 'opportunity_score':
        default:
          return sorted.sort((a, b) => b.opportunity_score - a.opportunity_score)
      }
    },

    // Filtered recommendations
    filteredRecommendations: (state) => {
      let filtered = state.recommendations
      
      if (state.filters.recommendations.category !== 'all') {
        filtered = filtered.filter(rec => rec.category === state.filters.recommendations.category)
      }
      
      if (state.filters.recommendations.priority !== 'all') {
        filtered = filtered.filter(rec => rec.priority === state.filters.recommendations.priority)
      }
      
      if (state.filters.recommendations.status !== 'all') {
        filtered = filtered.filter(rec => rec.status === state.filters.recommendations.status)
      }
      
      if (state.filters.recommendations.effort !== 'all') {
        filtered = filtered.filter(rec => rec.effort === state.filters.recommendations.effort)
      }
      
      return filtered.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    },

    // Analysis statistics
    analysisStats: (state) => ({
      total_competitors: state.competitors.length,
      active_competitors: state.competitors.filter(c => c.status === 'active').length,
      high_priority_competitors: state.competitors.filter(c => c.priority === 'high').length,
      
      total_insights: state.insights.length,
      high_confidence_insights: state.insights.filter(i => i.confidence >= 0.8).length,
      high_impact_insights: state.insights.filter(i => i.impact === 'high').length,
      
      trending_opportunities: state.trends.filter(t => t.opportunity_score >= 70).length,
      positive_sentiment_trends: state.trends.filter(t => t.sentiment === 'positive').length,
      
      pending_recommendations: state.recommendations.filter(r => r.status === 'pending').length,
      high_priority_recommendations: state.recommendations.filter(r => r.priority === 'high').length
    }),

    // Check if currently analyzing
    isAnalyzing: (state) => {
      return state.currentAnalysisJob?.status === 'running' || state.loading.analysis
    }
  },

  actions: {
    // Competitor management
    async fetchCompetitors() {
      this.loading.competitors = true
      this.errors.competitors = null
      
      try {
        const response = await $fetch('/api/admin/twitter/competitors', {
          query: {
            page: this.pagination.competitors.page,
            limit: this.pagination.competitors.limit,
            ...this.filters.competitors
          }
        })
        
        this.competitors = response.competitors
        this.pagination.competitors.total = response.total
      } catch (error: any) {
        this.errors.competitors = error.message || 'Failed to fetch competitors'
      } finally {
        this.loading.competitors = false
      }
    },

    async addCompetitor(competitor: Omit<TwitterCompetitor, 'id' | 'created_at' | 'updated_at'>) {
      try {
        const response = await $fetch('/api/admin/twitter/competitors', {
          method: 'POST',
          body: competitor
        })
        
        this.competitors.unshift(response.competitor)
        this.pagination.competitors.total++
        
        return response.competitor
      } catch (error: any) {
        this.errors.competitors = error.message || 'Failed to add competitor'
        throw error
      }
    },

    async removeCompetitor(competitorId: string) {
      try {
        await $fetch(`/api/admin/twitter/competitors/${competitorId}`, {
          method: 'DELETE'
        })
        
        this.competitors = this.competitors.filter(c => c.id !== competitorId)
        this.pagination.competitors.total--
      } catch (error: any) {
        this.errors.competitors = error.message || 'Failed to remove competitor'
        throw error
      }
    },

    // Analysis operations
    async analyzeCompetitor(username: string, includeRecommendations = false) {
      this.loading.analysis = true
      this.errors.analysis = null
      
      try {
        const response = await $fetch('/api/admin/twitter/analyze', {
          method: 'POST',
          body: { username, includeRecommendations }
        })
        
        // Update competitor data if exists
        const competitorIndex = this.competitors.findIndex(c => c.username === username)
        if (competitorIndex !== -1) {
          this.competitors[competitorIndex].last_analyzed = new Date().toISOString()
          this.competitors[competitorIndex].metrics = response.analysis?.metrics
        }
        
        return response
      } catch (error: any) {
        this.errors.analysis = error.message || 'Failed to analyze competitor'
        throw error
      } finally {
        this.loading.analysis = false
      }
    },

    async runLangChainAnalysis(competitorUsernames: string[], includeRecommendations = true) {
      this.loading.analysis = true
      this.errors.analysis = null
      
      try {
        const response = await $fetch('/api/admin/twitter/analyze-langchain', {
          method: 'POST',
          body: { competitorUsernames, includeRecommendations }
        })
        
        // Update current analysis job
        this.currentAnalysisJob = {
          id: response.workflowId || 'current',
          competitors: competitorUsernames,
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          total_cost: response.totalCost,
          include_recommendations: includeRecommendations
        }
        
        // Add new insights
        if (response.insights) {
          this.insights.unshift(...response.insights)
        }
        
        // Add new recommendations  
        if (response.recommendations) {
          this.recommendations.unshift(...response.recommendations)
        }
        
        return response
      } catch (error: any) {
        this.errors.analysis = error.message || 'Failed to run LangChain analysis'
        
        if (this.currentAnalysisJob) {
          this.currentAnalysisJob.status = 'failed'
          this.currentAnalysisJob.error_message = error.message
        }
        
        throw error
      } finally {
        this.loading.analysis = false
      }
    },

    // Data fetching
    async fetchInsights() {
      this.loading.insights = true
      this.errors.insights = null
      
      try {
        const response = await $fetch('/api/admin/twitter/insights', {
          query: {
            page: this.pagination.insights.page,
            limit: this.pagination.insights.limit,
            ...this.filters.insights
          }
        })
        
        this.insights = response.insights
        this.pagination.insights.total = response.total
      } catch (error: any) {
        this.errors.insights = error.message || 'Failed to fetch insights'
      } finally {
        this.loading.insights = false
      }
    },

    async fetchTrends() {
      this.loading.trends = true
      this.errors.trends = null
      
      try {
        const response = await $fetch('/api/admin/twitter/trends')
        this.trends = response.trends
      } catch (error: any) {
        this.errors.trends = error.message || 'Failed to fetch trends'
      } finally {
        this.loading.trends = false
      }
    },

    async fetchRecommendations() {
      this.loading.recommendations = true
      this.errors.recommendations = null
      
      try {
        const response = await $fetch('/api/admin/twitter/recommendations', {
          query: {
            page: this.pagination.recommendations.page,
            limit: this.pagination.recommendations.limit,
            ...this.filters.recommendations
          }
        })
        
        this.recommendations = response.recommendations
        this.pagination.recommendations.total = response.total
      } catch (error: any) {
        this.errors.recommendations = error.message || 'Failed to fetch recommendations'
      } finally {
        this.loading.recommendations = false
      }
    },

    async fetchOverview() {
      this.loading.overview = true
      this.errors.overview = null
      
      try {
        const response = await $fetch('/api/admin/twitter/overview')
        this.overview = response.overview
      } catch (error: any) {
        this.errors.overview = error.message || 'Failed to fetch overview'
      } finally {
        this.loading.overview = false
      }
    },

    // Recommendation management
    async updateRecommendationStatus(recommendationId: string, status: TwitterRecommendation['status']) {
      try {
        await $fetch(`/api/admin/twitter/recommendations/${recommendationId}`, {
          method: 'PATCH',
          body: { status }
        })
        
        const index = this.recommendations.findIndex(r => r.id === recommendationId)
        if (index !== -1) {
          this.recommendations[index].status = status
        }
      } catch (error: any) {
        throw new Error(error.message || 'Failed to update recommendation status')
      }
    },

    // Filter management
    updateCompetitorFilters(filters: Partial<TwitterFilters['competitors']>) {
      this.filters.competitors = { ...this.filters.competitors, ...filters }
      this.pagination.competitors.page = 1 // Reset to first page
    },

    updateInsightFilters(filters: Partial<TwitterFilters['insights']>) {
      this.filters.insights = { ...this.filters.insights, ...filters }
      this.pagination.insights.page = 1
    },

    updateTrendFilters(filters: Partial<TwitterFilters['trends']>) {
      this.filters.trends = { ...this.filters.trends, ...filters }
    },

    updateRecommendationFilters(filters: Partial<TwitterFilters['recommendations']>) {
      this.filters.recommendations = { ...this.filters.recommendations, ...filters }
      this.pagination.recommendations.page = 1
    },

    // Settings management
    updateSettings(settings: Partial<TwitterState['settings']>) {
      this.settings = { ...this.settings, ...settings }
    },

    // Utility actions
    clearErrors() {
      this.errors = {
        competitors: null,
        insights: null,
        trends: null,
        recommendations: null,
        overview: null,
        analysis: null
      }
    },

    resetFilters() {
      this.filters = {
        competitors: { search: '', category: 'all', priority: 'all', status: 'all' },
        insights: { type: 'all', confidence_min: 0, impact: 'all', search: '' },
        trends: { category: 'all', min_volume: 0, sentiment: 'all', sort_by: 'opportunity_score' },
        recommendations: { category: 'all', priority: 'all', status: 'all', effort: 'all' }
      }
    },

    async refreshAllData() {
      await Promise.all([
        this.fetchCompetitors(),
        this.fetchInsights(),
        this.fetchTrends(),
        this.fetchRecommendations(),
        this.fetchOverview()
      ])
    }
  }
})