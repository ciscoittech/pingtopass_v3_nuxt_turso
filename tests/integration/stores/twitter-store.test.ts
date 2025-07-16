import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTwitterStore } from '../../../stores/twitter'

// Mock $fetch
global.$fetch = vi.fn()

describe('Twitter Store Integration Tests', () => {
  let store: ReturnType<typeof useTwitterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTwitterStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.competitors).toEqual([])
      expect(store.insights).toEqual([])
      expect(store.trends).toEqual([])
      expect(store.recommendations).toEqual([])
      expect(store.overview).toBeNull()
      expect(store.currentAnalysisJob).toBeNull()
    })

    it('should have correct initial loading states', () => {
      expect(store.loading.competitors).toBe(false)
      expect(store.loading.insights).toBe(false)
      expect(store.loading.trends).toBe(false)
      expect(store.loading.recommendations).toBe(false)
      expect(store.loading.overview).toBe(false)
      expect(store.loading.analysis).toBe(false)
    })

    it('should have correct initial error states', () => {
      expect(store.errors.competitors).toBeNull()
      expect(store.errors.insights).toBeNull()
      expect(store.errors.trends).toBeNull()
      expect(store.errors.recommendations).toBeNull()
      expect(store.errors.overview).toBeNull()
      expect(store.errors.analysis).toBeNull()
    })

    it('should have correct initial filter states', () => {
      expect(store.filters.competitors.search).toBe('')
      expect(store.filters.competitors.category).toBe('all')
      expect(store.filters.competitors.priority).toBe('all')
      expect(store.filters.competitors.status).toBe('all')
      
      expect(store.filters.insights.type).toBe('all')
      expect(store.filters.insights.confidence_min).toBe(0)
      expect(store.filters.insights.impact).toBe('all')
      expect(store.filters.insights.search).toBe('')
    })

    it('should have correct initial settings', () => {
      expect(store.settings.auto_refresh).toBe(true)
      expect(store.settings.refresh_interval).toBe(15)
      expect(store.settings.enable_notifications).toBe(true)
      expect(store.settings.analysis_frequency).toBe('daily')
    })
  })

  describe('Competitor Management', () => {
    it('should fetch competitors successfully', async () => {
      const mockResponse = {
        competitors: [
          {
            id: 'comp_1',
            username: 'awscloudgirl',
            category: 'cloud-certifications',
            priority: 'high',
            status: 'active',
            last_analyzed: '2024-01-15T10:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }
        ],
        total: 1
      }

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      await store.fetchCompetitors()

      expect(store.competitors).toHaveLength(1)
      expect(store.competitors[0].username).toBe('awscloudgirl')
      expect(store.pagination.competitors.total).toBe(1)
      expect(store.loading.competitors).toBe(false)
      expect(store.errors.competitors).toBeNull()
    })

    it('should handle fetch competitors error', async () => {
      vi.mocked($fetch).mockRejectedValue(new Error('API Error'))

      await store.fetchCompetitors()

      expect(store.competitors).toEqual([])
      expect(store.loading.competitors).toBe(false)
      expect(store.errors.competitors).toBe('API Error')
    })

    it('should add competitor successfully', async () => {
      const newCompetitor = {
        username: 'certexpert',
        category: 'security',
        priority: 'medium' as const,
        status: 'active' as const,
        last_analyzed: '2024-01-15T10:00:00Z'
      }

      const mockResponse = {
        competitor: {
          id: 'comp_2',
          ...newCompetitor,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      }

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      const result = await store.addCompetitor(newCompetitor)

      expect(result.username).toBe('certexpert')
      expect(store.competitors).toHaveLength(1)
      expect(store.competitors[0].username).toBe('certexpert')
      expect(store.pagination.competitors.total).toBe(1)
    })

    it('should handle add competitor error', async () => {
      vi.mocked($fetch).mockRejectedValue(new Error('Duplicate competitor'))

      const newCompetitor = {
        username: 'duplicate',
        category: 'cloud-certifications',
        priority: 'low' as const,
        status: 'active' as const,
        last_analyzed: '2024-01-15T10:00:00Z'
      }

      await expect(store.addCompetitor(newCompetitor)).rejects.toThrow('Duplicate competitor')
      expect(store.errors.competitors).toBe('Duplicate competitor')
    })

    it('should remove competitor successfully', async () => {
      // Add a competitor first
      store.competitors = [{
        id: 'comp_1',
        username: 'toremove',
        category: 'cloud-certifications',
        priority: 'low',
        status: 'active',
        last_analyzed: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }]
      store.pagination.competitors.total = 1

      vi.mocked($fetch).mockResolvedValue({})

      await store.removeCompetitor('comp_1')

      expect(store.competitors).toHaveLength(0)
      expect(store.pagination.competitors.total).toBe(0)
    })
  })

  describe('Analysis Operations', () => {
    it('should analyze competitor successfully', async () => {
      const mockResponse = {
        analysis: {
          user: { username: 'testuser' },
          metrics: {
            followers: 10000,
            engagement_rate: 4.2,
            posting_frequency: 2.5
          }
        },
        cost: 0.05,
        timestamp: '2024-01-15T10:00:00Z'
      }

      // Add competitor to store first
      store.competitors = [{
        id: 'comp_1',
        username: 'testuser',
        category: 'cloud-certifications',
        priority: 'high',
        status: 'active',
        last_analyzed: '2024-01-14T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-14T10:00:00Z'
      }]

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      const result = await store.analyzeCompetitor('testuser', false)

      expect(result.analysis.user.username).toBe('testuser')
      expect(store.competitors[0].metrics?.followers).toBe(10000)
      expect(store.loading.analysis).toBe(false)
      expect(store.errors.analysis).toBeNull()
    })

    it('should handle analyze competitor error', async () => {
      vi.mocked($fetch).mockRejectedValue(new Error('Analysis failed'))

      await expect(store.analyzeCompetitor('nonexistent', false)).rejects.toThrow('Analysis failed')
      expect(store.loading.analysis).toBe(false)
      expect(store.errors.analysis).toBe('Analysis failed')
    })

    it('should run LangChain analysis successfully', async () => {
      const mockResponse = {
        workflowId: 'workflow_123',
        competitorAnalyses: [],
        insights: [
          {
            id: 'insight_1',
            type: 'content_strategy',
            title: 'Test Insight',
            description: 'Test description',
            confidence: 0.85,
            impact: 'high',
            recommendation: 'Test recommendation',
            actionable_steps: ['Step 1', 'Step 2'],
            competitors_involved: ['testuser'],
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        recommendations: [
          {
            id: 'rec_1',
            category: 'content',
            title: 'Test Recommendation',
            description: 'Test description',
            priority: 'high',
            effort: 'medium',
            expected_impact: 'Increase engagement by 25%',
            implementation_steps: ['Step 1'],
            success_metrics: ['Engagement rate'],
            timeline: '4 weeks',
            budget_required: 'low',
            status: 'pending'
          }
        ],
        totalCost: 0.25
      }

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      const result = await store.runLangChainAnalysis(['testuser'], true)

      expect(result.workflowId).toBe('workflow_123')
      expect(store.insights).toHaveLength(1)
      expect(store.recommendations).toHaveLength(1)
      expect(store.currentAnalysisJob?.status).toBe('completed')
      expect(store.currentAnalysisJob?.total_cost).toBe(0.25)
    })

    it('should handle LangChain analysis error', async () => {
      vi.mocked($fetch).mockRejectedValue(new Error('LangChain error'))

      await expect(store.runLangChainAnalysis(['testuser'], true)).rejects.toThrow('LangChain error')
      expect(store.errors.analysis).toBe('LangChain error')
    })
  })

  describe('Data Fetching', () => {
    it('should fetch insights successfully', async () => {
      const mockResponse = {
        insights: [
          {
            id: 'insight_1',
            type: 'content_strategy',
            title: 'Educational Content Works',
            description: 'Educational content gets 2x engagement',
            confidence: 0.92,
            impact: 'high',
            recommendation: 'Create more educational content',
            actionable_steps: ['Plan content calendar'],
            competitors_involved: ['competitor1'],
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        total: 1
      }

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      await store.fetchInsights()

      expect(store.insights).toHaveLength(1)
      expect(store.insights[0].title).toBe('Educational Content Works')
      expect(store.pagination.insights.total).toBe(1)
      expect(store.loading.insights).toBe(false)
      expect(store.errors.insights).toBeNull()
    })

    it('should fetch trends successfully', async () => {
      const mockResponse = {
        trends: [
          {
            tag: '#AWSCertification',
            volume: 15420,
            category: 'technology',
            growth: 23.5,
            sentiment: 'positive',
            opportunity_score: 85
          }
        ]
      }

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      await store.fetchTrends()

      expect(store.trends).toHaveLength(1)
      expect(store.trends[0].tag).toBe('#AWSCertification')
      expect(store.trends[0].opportunity_score).toBe(85)
      expect(store.loading.trends).toBe(false)
      expect(store.errors.trends).toBeNull()
    })

    it('should fetch overview successfully', async () => {
      const mockResponse = {
        overview: {
          analyzed_competitors: 5,
          insights_generated: 12,
          trends_identified: 8,
          last_updated: '2024-01-15T10:00:00Z'
        }
      }

      vi.mocked($fetch).mockResolvedValue(mockResponse)

      await store.fetchOverview()

      expect(store.overview?.analyzed_competitors).toBe(5)
      expect(store.overview?.insights_generated).toBe(12)
      expect(store.overview?.trends_identified).toBe(8)
      expect(store.loading.overview).toBe(false)
      expect(store.errors.overview).toBeNull()
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      // Set up test data
      store.competitors = [
        {
          id: 'comp_1',
          username: 'awscloudgirl',
          category: 'cloud-certifications',
          priority: 'high',
          status: 'active',
          last_analyzed: '2024-01-15T10:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'comp_2',
          username: 'securityexpert',
          category: 'security',
          priority: 'medium',
          status: 'paused',
          last_analyzed: '2024-01-14T10:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-14T10:00:00Z'
        }
      ]

      store.insights = [
        {
          id: 'insight_1',
          type: 'content_strategy',
          title: 'High confidence insight',
          description: 'Test description',
          confidence: 0.95,
          impact: 'high',
          recommendation: 'Test recommendation',
          actionable_steps: ['Step 1'],
          competitors_involved: ['awscloudgirl'],
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'insight_2',
          type: 'posting_patterns',
          title: 'Medium confidence insight',
          description: 'Test description',
          confidence: 0.75,
          impact: 'medium',
          recommendation: 'Test recommendation',
          actionable_steps: ['Step 1'],
          competitors_involved: ['securityexpert'],
          created_at: '2024-01-14T10:00:00Z'
        }
      ]

      store.trends = [
        {
          tag: '#AWSCertification',
          volume: 15420,
          category: 'technology',
          growth: 23.5,
          sentiment: 'positive',
          opportunity_score: 85
        },
        {
          tag: '#CloudSecurity',
          volume: 8750,
          category: 'security',
          growth: -5.2,
          sentiment: 'neutral',
          opportunity_score: 65
        }
      ]

      store.recommendations = [
        {
          id: 'rec_1',
          category: 'content',
          title: 'High priority recommendation',
          description: 'Test description',
          priority: 'high',
          effort: 'low',
          expected_impact: 'Increase engagement by 25%',
          implementation_steps: ['Step 1'],
          success_metrics: ['Engagement rate'],
          timeline: '2 weeks',
          budget_required: 'none',
          status: 'pending'
        },
        {
          id: 'rec_2',
          category: 'timing',
          title: 'Medium priority recommendation',
          description: 'Test description',
          priority: 'medium',
          effort: 'medium',
          expected_impact: 'Increase reach by 15%',
          implementation_steps: ['Step 1'],
          success_metrics: ['Reach'],
          timeline: '4 weeks',
          budget_required: 'low',
          status: 'in_progress'
        }
      ]
    })

    it('should filter competitors correctly', () => {
      // Test search filter
      store.updateCompetitorFilters({ search: 'aws' })
      expect(store.filteredCompetitors).toHaveLength(1)
      expect(store.filteredCompetitors[0].username).toBe('awscloudgirl')

      // Test category filter
      store.updateCompetitorFilters({ search: '', category: 'security' })
      expect(store.filteredCompetitors).toHaveLength(1)
      expect(store.filteredCompetitors[0].category).toBe('security')

      // Test priority filter
      store.updateCompetitorFilters({ category: 'all', priority: 'high' })
      expect(store.filteredCompetitors).toHaveLength(1)
      expect(store.filteredCompetitors[0].priority).toBe('high')

      // Test status filter
      store.updateCompetitorFilters({ priority: 'all', status: 'active' })
      expect(store.filteredCompetitors).toHaveLength(1)
      expect(store.filteredCompetitors[0].status).toBe('active')
    })

    it('should filter insights correctly', () => {
      // Test confidence filter
      store.updateInsightFilters({ confidence_min: 0.8 })
      expect(store.filteredInsights).toHaveLength(1)
      expect(store.filteredInsights[0].confidence).toBeGreaterThanOrEqual(0.8)

      // Test type filter
      store.updateInsightFilters({ confidence_min: 0, type: 'content_strategy' })
      expect(store.filteredInsights).toHaveLength(1)
      expect(store.filteredInsights[0].type).toBe('content_strategy')

      // Test impact filter
      store.updateInsightFilters({ type: 'all', impact: 'high' })
      expect(store.filteredInsights).toHaveLength(1)
      expect(store.filteredInsights[0].impact).toBe('high')

      // Test search filter
      store.updateInsightFilters({ impact: 'all', search: 'confidence' })
      expect(store.filteredInsights).toHaveLength(2) // Both insights contain 'confidence' in title
    })

    it('should sort trends correctly', () => {
      // Test sort by opportunity score (default)
      expect(store.sortedTrends[0].opportunity_score).toBe(85)
      expect(store.sortedTrends[1].opportunity_score).toBe(65)

      // Test sort by volume
      store.updateTrendFilters({ sort_by: 'volume' })
      expect(store.sortedTrends[0].volume).toBe(15420)

      // Test sort by growth
      store.updateTrendFilters({ sort_by: 'growth' })
      expect(store.sortedTrends[0].growth).toBe(23.5)
    })

    it('should filter recommendations correctly', () => {
      // Reset filters first
      store.resetFilters()
      
      // Test all recommendations are visible without filters
      expect(store.filteredRecommendations).toHaveLength(2)
      
      // Test priority filter
      store.updateRecommendationFilters({ priority: 'high' })
      expect(store.filteredRecommendations).toHaveLength(1)
      expect(store.filteredRecommendations[0].priority).toBe('high')

      // Reset and test category filter
      store.resetFilters()
      store.updateRecommendationFilters({ category: 'timing' })
      expect(store.filteredRecommendations).toHaveLength(1)
      expect(store.filteredRecommendations[0].category).toBe('timing')

      // Reset and test status filter
      store.resetFilters()
      store.updateRecommendationFilters({ status: 'pending' })
      expect(store.filteredRecommendations).toHaveLength(1)
      expect(store.filteredRecommendations[0].status).toBe('pending')
    })

    it('should calculate analysis stats correctly', () => {
      const stats = store.analysisStats

      expect(stats.total_competitors).toBe(2)
      expect(stats.active_competitors).toBe(1)
      expect(stats.high_priority_competitors).toBe(1)

      expect(stats.total_insights).toBe(2)
      expect(stats.high_confidence_insights).toBe(1) // >= 0.8
      expect(stats.high_impact_insights).toBe(1)

      expect(stats.trending_opportunities).toBe(1) // opportunity_score >= 70
      expect(stats.positive_sentiment_trends).toBe(1)

      expect(stats.pending_recommendations).toBe(1)
      expect(stats.high_priority_recommendations).toBe(1)
    })

    it('should detect analyzing state correctly', () => {
      expect(store.isAnalyzing).toBe(false)

      store.loading.analysis = true
      expect(store.isAnalyzing).toBe(true)

      store.loading.analysis = false
      store.currentAnalysisJob = {
        id: 'job_1',
        competitors: ['test'],
        status: 'running',
        progress: 50,
        total_cost: 0.1,
        include_recommendations: true
      }
      expect(store.isAnalyzing).toBe(true)
    })
  })

  describe('Filter Management', () => {
    it('should update competitor filters and reset pagination', () => {
      store.pagination.competitors.page = 3

      store.updateCompetitorFilters({ search: 'aws', category: 'cloud-certifications' })

      expect(store.filters.competitors.search).toBe('aws')
      expect(store.filters.competitors.category).toBe('cloud-certifications')
      expect(store.pagination.competitors.page).toBe(1) // Should reset to page 1
    })

    it('should update insight filters and reset pagination', () => {
      store.pagination.insights.page = 2

      store.updateInsightFilters({ type: 'content_strategy', confidence_min: 0.8 })

      expect(store.filters.insights.type).toBe('content_strategy')
      expect(store.filters.insights.confidence_min).toBe(0.8)
      expect(store.pagination.insights.page).toBe(1)
    })

    it('should reset all filters', () => {
      // Set some filters first
      store.updateCompetitorFilters({ search: 'test', category: 'security' })
      store.updateInsightFilters({ type: 'content_strategy', confidence_min: 0.8 })

      store.resetFilters()

      expect(store.filters.competitors.search).toBe('')
      expect(store.filters.competitors.category).toBe('all')
      expect(store.filters.insights.type).toBe('all')
      expect(store.filters.insights.confidence_min).toBe(0)
    })
  })

  describe('Settings Management', () => {
    it('should update settings correctly', () => {
      store.updateSettings({
        auto_refresh: false,
        refresh_interval: 30,
        analysis_frequency: 'weekly'
      })

      expect(store.settings.auto_refresh).toBe(false)
      expect(store.settings.refresh_interval).toBe(30)
      expect(store.settings.analysis_frequency).toBe('weekly')
      expect(store.settings.enable_notifications).toBe(true) // Should remain unchanged
    })
  })

  describe('Utility Actions', () => {
    it('should clear all errors', () => {
      // Set some errors first
      store.errors.competitors = 'Test error'
      store.errors.insights = 'Another error'

      store.clearErrors()

      expect(store.errors.competitors).toBeNull()
      expect(store.errors.insights).toBeNull()
      expect(store.errors.trends).toBeNull()
      expect(store.errors.recommendations).toBeNull()
      expect(store.errors.overview).toBeNull()
      expect(store.errors.analysis).toBeNull()
    })

    it('should refresh all data', async () => {
      const mockResponses = {
        competitors: { competitors: [], total: 0 },
        insights: { insights: [], total: 0 },
        trends: { trends: [] },
        recommendations: { recommendations: [], total: 0 },
        overview: { overview: null }
      }

      vi.mocked($fetch)
        .mockResolvedValueOnce(mockResponses.competitors)
        .mockResolvedValueOnce(mockResponses.insights)
        .mockResolvedValueOnce(mockResponses.trends)
        .mockResolvedValueOnce(mockResponses.recommendations)
        .mockResolvedValueOnce(mockResponses.overview)

      await store.refreshAllData()

      expect($fetch).toHaveBeenCalledTimes(5)
      expect(store.loading.competitors).toBe(false)
      expect(store.loading.insights).toBe(false)
      expect(store.loading.trends).toBe(false)
      expect(store.loading.recommendations).toBe(false)
      expect(store.loading.overview).toBe(false)
    })
  })

  describe('Recommendation Management', () => {
    it('should update recommendation status successfully', async () => {
      // Add a recommendation to the store
      store.recommendations = [{
        id: 'rec_1',
        category: 'content',
        title: 'Test Recommendation',
        description: 'Test description',
        priority: 'high',
        effort: 'low',
        expected_impact: 'Test impact',
        implementation_steps: ['Step 1'],
        success_metrics: ['Metric 1'],
        timeline: '2 weeks',
        budget_required: 'none',
        status: 'pending'
      }]

      vi.mocked($fetch).mockResolvedValue({})

      await store.updateRecommendationStatus('rec_1', 'completed')

      expect(store.recommendations[0].status).toBe('completed')
      expect($fetch).toHaveBeenCalledWith('/api/admin/twitter/recommendations/rec_1', {
        method: 'PATCH',
        body: { status: 'completed' }
      })
    })

    it('should handle recommendation status update error', async () => {
      vi.mocked($fetch).mockRejectedValue(new Error('Update failed'))

      await expect(store.updateRecommendationStatus('rec_1', 'completed'))
        .rejects.toThrow('Update failed')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked($fetch).mockRejectedValue(new TypeError('Network error'))

      await store.fetchCompetitors()

      expect(store.loading.competitors).toBe(false)
      expect(store.errors.competitors).toBe('Network error')
      expect(store.competitors).toEqual([])
    })

    it('should handle API errors with custom messages', async () => {
      vi.mocked($fetch).mockRejectedValue({
        message: 'API rate limit exceeded',
        statusCode: 429
      })

      await store.fetchInsights()

      expect(store.errors.insights).toBe('API rate limit exceeded')
    })

    it('should handle unknown errors', async () => {
      vi.mocked($fetch).mockRejectedValue('Unknown error')

      await store.fetchTrends()

      expect(store.errors.trends).toBe('Failed to fetch trends')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent API calls correctly', async () => {
      const responses = [
        { competitors: [], total: 0 },
        { insights: [], total: 0 },
        { trends: [] }
      ]

      vi.mocked($fetch)
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2])

      // Start concurrent operations
      const promises = [
        store.fetchCompetitors(),
        store.fetchInsights(),
        store.fetchTrends()
      ]

      await Promise.all(promises)

      expect($fetch).toHaveBeenCalledTimes(3)
      expect(store.loading.competitors).toBe(false)
      expect(store.loading.insights).toBe(false)
      expect(store.loading.trends).toBe(false)
    })

    it('should handle partial failures in concurrent operations', async () => {
      vi.mocked($fetch)
        .mockResolvedValueOnce({ competitors: [], total: 0 })
        .mockRejectedValueOnce(new Error('Insights failed'))
        .mockResolvedValueOnce({ trends: [] })

      await Promise.allSettled([
        store.fetchCompetitors(),
        store.fetchInsights(),
        store.fetchTrends()
      ])

      expect(store.errors.competitors).toBeNull()
      expect(store.errors.insights).toBe('Insights failed')
      expect(store.errors.trends).toBeNull()
    })
  })
})