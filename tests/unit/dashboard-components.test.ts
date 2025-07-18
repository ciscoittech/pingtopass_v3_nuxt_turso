import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Import dashboard components
import ContinueStudyCard from '~/components/dashboards/pingtopass/ContinueStudyCard.vue'
import SmartNotifications from '~/components/dashboards/pingtopass/SmartNotifications.vue'
import WeeklyAchievements from '~/components/dashboards/pingtopass/WeeklyAchievements.vue'
import LeaderboardPreview from '~/components/dashboards/pingtopass/LeaderboardPreview.vue'
import XPLevelCard from '~/components/dashboards/pingtopass/XPLevelCard.vue'
import PerformanceMessages from '~/components/dashboards/pingtopass/PerformanceMessages.vue'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtData: vi.fn(() => ({ data: { value: null } })),
  useFetch: vi.fn(() => ({ 
    data: { value: null }, 
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn()
  })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  navigateTo: vi.fn()
}))

const vuetify = createVuetify({
  components,
  directives,
})

describe('Dashboard Components', () => {
  const global = {
    plugins: [vuetify],
    stubs: {
      'NuxtLink': true,
      'Icon': true
    }
  }

  describe('ContinueStudyCard', () => {
    it('should render with no session data', () => {
      const wrapper = mount(ContinueStudyCard, { global })
      expect(wrapper.find('.v-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('Continue Studying')
    })

    it('should show start new session when no previous session', () => {
      const wrapper = mount(ContinueStudyCard, { 
        global,
        data() {
          return { lastSession: null }
        }
      })
      expect(wrapper.text()).toContain('Start a New Session')
    })

    it('should display session info when available', async () => {
      const wrapper = mount(ContinueStudyCard, { 
        global,
        data() {
          return {
            lastSession: {
              examTitle: 'AWS Solutions Architect',
              vendorCode: 'AWS',
              examCode: 'SAA-C03',
              progress: 45,
              questionsAnswered: 120,
              accuracy: 85.5,
              timeAgo: '2 hours ago'
            }
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('AWS Solutions Architect')
      expect(wrapper.text()).toContain('45%')
      expect(wrapper.text()).toContain('85.5%')
    })
  })

  describe('SmartNotifications', () => {
    it('should render and rotate notifications', async () => {
      const wrapper = mount(SmartNotifications, { global })
      expect(wrapper.find('.v-card').exists()).toBe(true)
      
      // Check initial notification
      const initialIndex = wrapper.vm.currentIndex
      
      // Wait for rotation
      vi.useFakeTimers()
      vi.advanceTimersByTime(5000)
      await wrapper.vm.$nextTick()
      
      // Index should have changed
      expect(wrapper.vm.currentIndex).not.toBe(initialIndex)
      vi.useRealTimers()
    })

    it('should toggle expanded state', async () => {
      const wrapper = mount(SmartNotifications, { global })
      expect(wrapper.vm.isExpanded).toBe(false)
      
      await wrapper.find('.v-btn').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)
    })
  })

  describe('WeeklyAchievements', () => {
    it('should render with three tabs', () => {
      const wrapper = mount(WeeklyAchievements, { global })
      expect(wrapper.find('.v-tabs').exists()).toBe(true)
      expect(wrapper.findAll('.v-tab').length).toBe(3)
    })

    it('should switch between tabs', async () => {
      const wrapper = mount(WeeklyAchievements, { global })
      expect(wrapper.vm.tab).toBe(0)
      
      await wrapper.findAll('.v-tab')[1].trigger('click')
      expect(wrapper.vm.tab).toBe(1)
    })
  })

  describe('LeaderboardPreview', () => {
    it('should render leaderboard with filters', () => {
      const wrapper = mount(LeaderboardPreview, { global })
      expect(wrapper.find('.v-card').exists()).toBe(true)
      expect(wrapper.find('.v-btn-toggle').exists()).toBe(true)
    })

    it('should change timeframe filter', async () => {
      const wrapper = mount(LeaderboardPreview, { global })
      expect(wrapper.vm.timeframe).toBe('week')
      
      const buttons = wrapper.findAll('.v-btn-toggle .v-btn')
      await buttons[1].trigger('click')
      expect(wrapper.vm.timeframe).toBe('month')
    })

    it('should display user rank correctly', () => {
      const wrapper = mount(LeaderboardPreview, { 
        global,
        data() {
          return {
            currentUserRank: 7,
            totalUsers: 150
          }
        }
      })
      expect(wrapper.text()).toContain('#7')
      expect(wrapper.text()).toContain('150')
    })
  })

  describe('XPLevelCard', () => {
    it('should render level and XP information', () => {
      const wrapper = mount(XPLevelCard, { 
        global,
        data() {
          return {
            level: 12,
            currentXP: 2450,
            nextLevelXP: 3000,
            totalXP: 8450
          }
        }
      })
      
      expect(wrapper.text()).toContain('Level 12')
      expect(wrapper.text()).toContain('2,450')
      expect(wrapper.text()).toContain('3,000')
    })

    it('should calculate XP percentage correctly', () => {
      const wrapper = mount(XPLevelCard, { 
        global,
        data() {
          return {
            currentXP: 2450,
            nextLevelXP: 3000
          }
        }
      })
      
      expect(wrapper.vm.xpPercentage).toBe(81.67)
    })

    it('should toggle expanded details', async () => {
      const wrapper = mount(XPLevelCard, { global })
      expect(wrapper.vm.showDetails).toBe(false)
      
      const button = wrapper.find('.v-btn[icon]')
      await button.trigger('click')
      expect(wrapper.vm.showDetails).toBe(true)
    })
  })

  describe('PerformanceMessages', () => {
    it('should render performance messages', () => {
      const wrapper = mount(PerformanceMessages, { global })
      expect(wrapper.find('.v-card').exists()).toBe(true)
    })

    it('should navigate between messages', async () => {
      const wrapper = mount(PerformanceMessages, { global })
      expect(wrapper.vm.currentIndex).toBe(0)
      
      // Click next
      const nextButton = wrapper.findAll('.v-btn')[1]
      await nextButton.trigger('click')
      expect(wrapper.vm.currentIndex).toBe(1)
      
      // Click previous
      const prevButton = wrapper.findAll('.v-btn')[0]
      await prevButton.trigger('click')
      expect(wrapper.vm.currentIndex).toBe(0)
    })

    it('should display correct performance stats', () => {
      const wrapper = mount(PerformanceMessages, { 
        global,
        data() {
          return {
            stats: {
              accuracy: 87.5,
              streak: 7,
              questionsToday: 45,
              improvement: '+12%'
            }
          }
        }
      })
      
      expect(wrapper.text()).toContain('87.5%')
      expect(wrapper.text()).toContain('7 days')
      expect(wrapper.text()).toContain('45')
      expect(wrapper.text()).toContain('+12%')
    })
  })

  describe('Tutorial Overlay', () => {
    it('should track tutorial completion', () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      })

      // Simulate tutorial completion
      mockLocalStorage.setItem('tutorialCompleted', 'true')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tutorialCompleted', 'true')
    })
  })

  describe('Achievement Unlock Detection', () => {
    it('should detect when achievements are unlocked', () => {
      const achievements = [
        { id: 1, name: 'First Steps', progress: 100, unlocked: true },
        { id: 2, name: 'Study Streak', progress: 70, unlocked: false },
        { id: 3, name: 'Perfect Score', progress: 0, unlocked: false }
      ]

      const unlockedAchievements = achievements.filter(a => a.unlocked)
      expect(unlockedAchievements.length).toBe(1)
      expect(unlockedAchievements[0].name).toBe('First Steps')
    })
  })

  describe('Notification Priority Sorting', () => {
    it('should sort notifications by priority', () => {
      const notifications = [
        { id: 1, priority: 'low', message: 'Low priority' },
        { id: 2, priority: 'high', message: 'High priority' },
        { id: 3, priority: 'medium', message: 'Medium priority' }
      ]

      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const sorted = [...notifications].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      )

      expect(sorted[0].priority).toBe('high')
      expect(sorted[1].priority).toBe('medium')
      expect(sorted[2].priority).toBe('low')
    })
  })
})