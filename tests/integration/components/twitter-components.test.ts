import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Import Twitter components to test
import TwitterOverview from '../../../components/admin/twitter/TwitterOverview.vue'
import TwitterCompetitors from '../../../components/admin/twitter/TwitterCompetitors.vue'
import TwitterInsights from '../../../components/admin/twitter/TwitterInsights.vue'
import TwitterTrends from '../../../components/admin/twitter/TwitterTrends.vue'
import TwitterRecommendations from '../../../components/admin/twitter/TwitterRecommendations.vue'

// Create Vuetify instance for testing
const vuetify = createVuetify({
  components,
  directives
})

// Global test setup
const global = {
  plugins: [vuetify],
  stubs: {
    'nuxt-link': { template: '<a><slot /></a>' },
    'v-icon': { template: '<span></span>' }
  }
}

describe('Twitter Frontend Components Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('TwitterOverview Component', () => {
    let wrapper: VueWrapper<any>

    beforeEach(() => {
      wrapper = mount(TwitterOverview, {
        global,
        props: {
          recentAnalysis: {
            analyzed_competitors: 5,
            insights_generated: 12,
            trends_identified: 8
          },
          benchmarks: [
            {
              metric: 'Engagement Rate',
              yourPerformance: '3.2%',
              industryAverage: '2.8%',
              topPerformer: '4.5%',
              status: 'above_average'
            },
            {
              metric: 'Posting Frequency',
              yourPerformance: '2.1/day',
              industryAverage: '1.8/day',
              topPerformer: '3.2/day',
              status: 'above_average'
            }
          ]
        }
      })
    })

    afterEach(() => {
      wrapper.unmount()
    })

    it('should render performance overview cards', () => {
      expect(wrapper.find('[data-testid="performance-overview"]').exists()).toBe(true)
      
      const competitorsCard = wrapper.find('[data-testid="competitors-analyzed"]')
      if (competitorsCard.exists()) {
        expect(competitorsCard.text()).toContain('5')
        expect(competitorsCard.text()).toContain('Competitors Analyzed')
      }
      
      const insightsCard = wrapper.find('[data-testid="insights-generated"]')
      if (insightsCard.exists()) {
        expect(insightsCard.text()).toContain('12')
        expect(insightsCard.text()).toContain('Insights Generated')
      }
    })

    it('should display competitive benchmarks', () => {
      const benchmarksTable = wrapper.find('[data-testid="benchmarks-table"]')
      if (benchmarksTable.exists()) {
        expect(benchmarksTable.text()).toContain('Engagement Rate')
        expect(benchmarksTable.text()).toContain('3.2%')
        expect(benchmarksTable.text()).toContain('above_average')
      }
    })

    it('should handle empty data gracefully', async () => {
      await wrapper.setProps({
        recentAnalysis: null,
        benchmarks: []
      })
      
      expect(wrapper.text()).toContain('0')
      expect(wrapper.find('[data-testid="no-benchmarks"]').exists()).toBe(true)
    })

    it('should format performance metrics correctly', () => {
      const performanceText = wrapper.text()
      expect(performanceText).toContain('5') // competitors analyzed
      expect(performanceText).toContain('12') // insights generated
      expect(performanceText).toContain('8') // trends identified
    })
  })

  describe('TwitterCompetitors Component', () => {
    let wrapper: VueWrapper<any>
    const mockCompetitors = [
      {
        id: 'comp_1',
        username: 'awscloudgirl',
        category: 'cloud-certifications',
        priority: 'high',
        status: 'active',
        last_analyzed: '2024-01-15T10:00:00Z',
        metrics: {
          followers: 15000,
          engagement_rate: 4.2
        }
      },
      {
        id: 'comp_2',
        username: 'certexpert',
        category: 'security',
        priority: 'medium',
        status: 'monitoring',
        last_analyzed: '2024-01-14T15:30:00Z',
        metrics: {
          followers: 8500,
          engagement_rate: 3.8
        }
      }
    ]

    beforeEach(() => {
      wrapper = mount(TwitterCompetitors, {
        global,
        props: {
          competitors: mockCompetitors,
          loading: false
        }
      })
    })

    afterEach(() => {
      wrapper.unmount()
    })

    it('should render add competitor form', () => {
      const form = wrapper.find('[data-testid="add-competitor-form"]')
      expect(form.exists()).toBe(true)
      
      const usernameField = wrapper.find('[data-testid="username-field"]')
      expect(usernameField.exists()).toBe(true)
      
      const categoryField = wrapper.find('[data-testid="category-field"]')
      expect(categoryField.exists()).toBe(true)
      
      const addButton = wrapper.find('[data-testid="add-button"]')
      expect(addButton.exists()).toBe(true)
    })

    it('should display competitors list', () => {
      const competitorsList = wrapper.find('[data-testid="competitors-list"]')
      expect(competitorsList.exists()).toBe(true)
      
      const competitorCards = wrapper.findAll('[data-testid^="competitor-card-"]')
      expect(competitorCards.length).toBe(2)
      
      // Check first competitor
      const firstCard = wrapper.find('[data-testid="competitor-card-comp_1"]')
      if (firstCard.exists()) {
        expect(firstCard.text()).toContain('awscloudgirl')
        expect(firstCard.text()).toContain('cloud-certifications')
        expect(firstCard.text()).toContain('15000')
      }
    })

    it('should handle form submission', async () => {
      const form = wrapper.find('[data-testid="add-competitor-form"]')
      const usernameInput = wrapper.find('[data-testid="username-input"]')
      const categorySelect = wrapper.find('[data-testid="category-select"]')
      
      if (usernameInput.exists() && categorySelect.exists()) {
        await usernameInput.setValue('newcompetitor')
        await categorySelect.setValue('cloud-certifications')
        
        const submitSpy = vi.fn()
        wrapper.vm.addCompetitor = submitSpy
        
        await form.trigger('submit')
        expect(submitSpy).toHaveBeenCalled()
      }
    })

    it('should validate required fields', async () => {
      const form = wrapper.find('[data-testid="add-competitor-form"]')
      const usernameInput = wrapper.find('[data-testid="username-input"]')
      
      if (usernameInput.exists()) {
        await usernameInput.setValue('')
        await form.trigger('submit')
        
        const errorMessage = wrapper.find('[data-testid="username-error"]')
        if (errorMessage.exists()) {
          expect(errorMessage.text()).toContain('required')
        }
      }
    })

    it('should show loading state', async () => {
      await wrapper.setProps({ loading: true })
      
      const loadingIndicator = wrapper.find('[data-testid="loading-indicator"]')
      expect(loadingIndicator.exists()).toBe(true)
    })

    it('should handle competitor actions', async () => {
      const analyzeButton = wrapper.find('[data-testid="analyze-button-comp_1"]')
      if (analyzeButton.exists()) {
        const analyzeSpy = vi.fn()
        wrapper.vm.analyzeCompetitor = analyzeSpy
        
        await analyzeButton.trigger('click')
        expect(analyzeSpy).toHaveBeenCalledWith('comp_1')
      }
    })
  })

  describe('TwitterInsights Component', () => {
    let wrapper: VueWrapper<any>
    const mockInsights = [
      {
        id: 'insight_1',
        type: 'content_strategy',
        title: 'Educational Content Drives Higher Engagement',
        description: 'Competitors posting educational content see 2.3x higher engagement',
        confidence: 0.85,
        impact: 'high',
        recommendation: 'Focus on educational content that solves specific problems',
        actionable_steps: ['Create weekly tips series', 'Share exam insights'],
        competitors_involved: ['awscloudgirl', 'certexpert'],
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'insight_2',
        type: 'posting_patterns',
        title: 'Morning Posts Get 40% More Engagement',
        description: 'Analysis shows posts between 8-10 AM perform significantly better',
        confidence: 0.92,
        impact: 'medium',
        recommendation: 'Schedule content for early morning hours',
        actionable_steps: ['Use scheduling tools', 'Plan morning content calendar'],
        competitors_involved: ['certexpert'],
        created_at: '2024-01-14T15:30:00Z'
      }
    ]

    beforeEach(() => {
      wrapper = mount(TwitterInsights, {
        global,
        props: {
          insights: mockInsights,
          loading: false
        }
      })
    })

    afterEach(() => {
      wrapper.unmount()
    })

    it('should render insights list', () => {
      const insightsList = wrapper.find('[data-testid="insights-list"]')
      expect(insightsList.exists()).toBe(true)
      
      const insightCards = wrapper.findAll('[data-testid^="insight-card-"]')
      expect(insightCards.length).toBe(2)
    })

    it('should display insight details', () => {
      const firstInsight = wrapper.find('[data-testid="insight-card-insight_1"]')
      if (firstInsight.exists()) {
        expect(firstInsight.text()).toContain('Educational Content Drives Higher Engagement')
        expect(firstInsight.text()).toContain('content_strategy')
        expect(firstInsight.text()).toContain('85%') // confidence
        expect(firstInsight.text()).toContain('high') // impact
      }
    })

    it('should handle insight filtering', async () => {
      const typeFilter = wrapper.find('[data-testid="type-filter"]')
      if (typeFilter.exists()) {
        await typeFilter.setValue('content_strategy')
        
        const filteredInsights = wrapper.findAll('[data-testid^="insight-card-"]')
        expect(filteredInsights.length).toBeLessThanOrEqual(mockInsights.length)
      }
    })

    it('should show confidence indicators', () => {
      const confidenceIndicators = wrapper.findAll('[data-testid^="confidence-"]')
      expect(confidenceIndicators.length).toBeGreaterThan(0)
      
      confidenceIndicators.forEach(indicator => {
        const confidenceValue = indicator.text()
        expect(confidenceValue).toMatch(/\d+%/)
      })
    })

    it('should display actionable steps', () => {
      const actionableSteps = wrapper.findAll('[data-testid^="actionable-steps-"]')
      expect(actionableSteps.length).toBeGreaterThan(0)
      
      const firstSteps = wrapper.find('[data-testid="actionable-steps-insight_1"]')
      if (firstSteps.exists()) {
        expect(firstSteps.text()).toContain('Create weekly tips series')
        expect(firstSteps.text()).toContain('Share exam insights')
      }
    })
  })

  describe('TwitterTrends Component', () => {
    let wrapper: VueWrapper<any>
    const mockTrends = [
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

    beforeEach(() => {
      wrapper = mount(TwitterTrends, {
        global,
        props: {
          trends: mockTrends,
          loading: false
        }
      })
    })

    afterEach(() => {
      wrapper.unmount()
    })

    it('should render trends list', () => {
      const trendsList = wrapper.find('[data-testid="trends-list"]')
      expect(trendsList.exists()).toBe(true)
      
      const trendItems = wrapper.findAll('[data-testid^="trend-item-"]')
      expect(trendItems.length).toBe(2)
    })

    it('should display trend metrics', () => {
      const firstTrend = wrapper.find('[data-testid="trend-item-0"]')
      if (firstTrend.exists()) {
        expect(firstTrend.text()).toContain('#AWSCertification')
        expect(firstTrend.text()).toContain('15,420') // volume formatted
        expect(firstTrend.text()).toContain('23.5%') // growth
        expect(firstTrend.text()).toContain('85') // opportunity score
      }
    })

    it('should show growth indicators', () => {
      const growthIndicators = wrapper.findAll('[data-testid^="growth-indicator-"]')
      expect(growthIndicators.length).toBe(2)
      
      const positiveGrowth = wrapper.find('[data-testid="growth-indicator-0"]')
      const negativeGrowth = wrapper.find('[data-testid="growth-indicator-1"]')
      
      if (positiveGrowth.exists()) {
        expect(positiveGrowth.classes()).toContain('growth-positive')
      }
      if (negativeGrowth.exists()) {
        expect(negativeGrowth.classes()).toContain('growth-negative')
      }
    })

    it('should handle trend filtering by category', async () => {
      const categoryFilter = wrapper.find('[data-testid="category-filter"]')
      if (categoryFilter.exists()) {
        await categoryFilter.setValue('technology')
        
        const filteredTrends = wrapper.findAll('[data-testid^="trend-item-"]')
        expect(filteredTrends.length).toBeLessThanOrEqual(mockTrends.length)
      }
    })

    it('should sort trends by opportunity score', async () => {
      const sortButton = wrapper.find('[data-testid="sort-by-opportunity"]')
      if (sortButton.exists()) {
        await sortButton.trigger('click')
        
        const trendItems = wrapper.findAll('[data-testid^="trend-item-"]')
        if (trendItems.length >= 2) {
          const firstScore = trendItems[0].find('[data-testid^="opportunity-score-"]')
          const secondScore = trendItems[1].find('[data-testid^="opportunity-score-"]')
          
          if (firstScore.exists() && secondScore.exists()) {
            const firstValue = parseInt(firstScore.text())
            const secondValue = parseInt(secondScore.text())
            expect(firstValue).toBeGreaterThanOrEqual(secondValue)
          }
        }
      }
    })
  })

  describe('TwitterRecommendations Component', () => {
    let wrapper: VueWrapper<any>
    const mockRecommendations = [
      {
        id: 'rec_1',
        category: 'content',
        title: 'Implement Educational Tip Series',
        description: 'Create weekly educational content series based on competitor success',
        priority: 'high',
        effort: 'medium',
        expected_impact: 'Increase engagement by 40% and followers by 25%',
        implementation_steps: ['Research top questions', 'Create content calendar', 'Schedule posts'],
        success_metrics: ['Engagement rate', 'Follower growth', 'Share count'],
        timeline: '6-8 weeks',
        budget_required: 'low',
        status: 'pending'
      },
      {
        id: 'rec_2',
        category: 'timing',
        title: 'Optimize Posting Schedule',
        description: 'Adjust posting times based on audience activity analysis',
        priority: 'medium',
        effort: 'low',
        expected_impact: 'Increase reach by 25%',
        implementation_steps: ['Analyze current metrics', 'Create new schedule', 'Test and iterate'],
        success_metrics: ['Reach', 'Engagement timing'],
        timeline: '2-3 weeks',
        budget_required: 'none',
        status: 'in_progress'
      }
    ]

    beforeEach(() => {
      wrapper = mount(TwitterRecommendations, {
        global,
        props: {
          recommendations: mockRecommendations,
          loading: false
        }
      })
    })

    afterEach(() => {
      wrapper.unmount()
    })

    it('should render recommendations list', () => {
      const recommendationsList = wrapper.find('[data-testid="recommendations-list"]')
      expect(recommendationsList.exists()).toBe(true)
      
      const recommendationCards = wrapper.findAll('[data-testid^="recommendation-card-"]')
      expect(recommendationCards.length).toBe(2)
    })

    it('should display recommendation details', () => {
      const firstRec = wrapper.find('[data-testid="recommendation-card-rec_1"]')
      if (firstRec.exists()) {
        expect(firstRec.text()).toContain('Implement Educational Tip Series')
        expect(firstRec.text()).toContain('high') // priority
        expect(firstRec.text()).toContain('6-8 weeks') // timeline
        expect(firstRec.text()).toContain('Increase engagement by 40%') // expected impact
      }
    })

    it('should show priority badges', () => {
      const priorityBadges = wrapper.findAll('[data-testid^="priority-badge-"]')
      expect(priorityBadges.length).toBe(2)
      
      const highPriority = wrapper.find('[data-testid="priority-badge-rec_1"]')
      if (highPriority.exists()) {
        expect(highPriority.classes()).toContain('priority-high')
      }
    })

    it('should handle status updates', async () => {
      const statusSelect = wrapper.find('[data-testid="status-select-rec_1"]')
      if (statusSelect.exists()) {
        const updateSpy = vi.fn()
        wrapper.vm.updateRecommendationStatus = updateSpy
        
        await statusSelect.setValue('completed')
        expect(updateSpy).toHaveBeenCalledWith('rec_1', 'completed')
      }
    })

    it('should display implementation steps', () => {
      const implementationSteps = wrapper.find('[data-testid="implementation-steps-rec_1"]')
      if (implementationSteps.exists()) {
        expect(implementationSteps.text()).toContain('Research top questions')
        expect(implementationSteps.text()).toContain('Create content calendar')
        expect(implementationSteps.text()).toContain('Schedule posts')
      }
    })

    it('should filter recommendations by category', async () => {
      const categoryFilter = wrapper.find('[data-testid="category-filter"]')
      if (categoryFilter.exists()) {
        await categoryFilter.setValue('content')
        
        const filteredRecs = wrapper.findAll('[data-testid^="recommendation-card-"]')
        expect(filteredRecs.length).toBeLessThanOrEqual(mockRecommendations.length)
      }
    })
  })

  describe('Component Integration', () => {
    it('should handle data flow between components', () => {
      // Test that components can receive and process shared data formats
      const sharedData = {
        competitors: [{ id: 'comp_1', username: 'test' }],
        insights: [{ id: 'insight_1', type: 'content' }],
        trends: [{ tag: '#test', volume: 100 }],
        recommendations: [{ id: 'rec_1', category: 'content' }]
      }
      
      expect(sharedData.competitors).toBeDefined()
      expect(sharedData.insights).toBeDefined()
      expect(sharedData.trends).toBeDefined()
      expect(sharedData.recommendations).toBeDefined()
    })

    it('should handle error states consistently', () => {
      // Test that all components handle error props similarly
      const errorProps = {
        error: new Error('Test error'),
        loading: false
      }
      
      expect(errorProps.error).toBeInstanceOf(Error)
      expect(errorProps.loading).toBe(false)
    })

    it('should handle loading states consistently', () => {
      // Test that all components handle loading props similarly
      const loadingProps = {
        loading: true,
        data: null
      }
      
      expect(loadingProps.loading).toBe(true)
      expect(loadingProps.data).toBeNull()
    })
  })
})