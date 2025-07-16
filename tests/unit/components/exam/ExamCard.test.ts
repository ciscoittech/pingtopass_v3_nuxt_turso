import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ExamCard from '~/components/exam/ExamCard.vue'
import type { Exam } from '~/types/exam'

const vuetify = createVuetify()

describe('ExamCard', () => {
  const mockExam: Exam = {
    id: '1',
    code: 'AZ-900',
    name: 'Azure Fundamentals',
    vendorId: 'microsoft',
    vendorName: 'Microsoft',
    difficulty: 'beginner',
    userProgress: 75,
    isActive: true,
    isBookmarked: true,
    popularity: 95,
    questionCount: 60,
    passRate: 85,
    duration: 90,
    price: 99,
    description: 'Foundational level knowledge of cloud services and Azure',
    tags: ['cloud', 'azure', 'fundamentals'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  }

  const mountComponent = (props = {}) => {
    return mount(ExamCard, {
      props: {
        exam: mockExam,
        ...props
      },
      global: {
        plugins: [vuetify],
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    })
  }

  it('renders exam information correctly', () => {
    const wrapper = mountComponent()
    
    expect(wrapper.find('.exam-code').text()).toBe('AZ-900')
    expect(wrapper.find('.exam-name').text()).toBe('Azure Fundamentals')
    expect(wrapper.find('.vendor-name').text()).toBe('Microsoft')
    expect(wrapper.find('.text-h5').text()).toBe('$99')
  })

  it('shows correct difficulty badge color', () => {
    const wrapper = mountComponent()
    const badge = wrapper.find('.difficulty-badge')
    
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Beginner')
    expect(badge.classes()).toContain('success')
  })

  it('displays progress correctly', () => {
    const wrapper = mountComponent()
    const progressBar = wrapper.findComponent({ name: 'v-progress-linear' })
    
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.props('modelValue')).toBe(75)
  })

  it('shows bookmark icon when bookmarked', () => {
    const wrapper = mountComponent()
    const bookmarkBtn = wrapper.find('.bookmark-btn')
    
    expect(bookmarkBtn.exists()).toBe(true)
    expect(bookmarkBtn.find('.v-icon').text()).toContain('mdi-bookmark')
  })

  it('emits toggle-bookmark event when bookmark clicked', async () => {
    const wrapper = mountComponent()
    const bookmarkBtn = wrapper.find('.bookmark-btn')
    
    await bookmarkBtn.trigger('click')
    
    expect(wrapper.emitted('toggle-bookmark')).toBeTruthy()
    expect(wrapper.emitted('toggle-bookmark')?.[0]).toEqual([])
  })

  it('emits view-details event when card clicked', async () => {
    const wrapper = mountComponent()
    const cardAction = wrapper.find('.v-card')
    
    await cardAction.trigger('click')
    
    expect(wrapper.emitted('view-details')).toBeTruthy()
  })

  it('emits start-exam event when start button clicked', async () => {
    const wrapper = mountComponent()
    const startBtn = wrapper.find('.start-btn')
    
    await startBtn.trigger('click')
    
    expect(wrapper.emitted('start-exam')).toBeTruthy()
  })

  it('shows free badge when price is 0', () => {
    const wrapper = mountComponent({
      exam: { ...mockExam, price: 0 }
    })
    
    expect(wrapper.find('.price-free').text()).toBe('FREE')
  })

  it('hides progress section when userProgress is null', () => {
    const wrapper = mountComponent({
      exam: { ...mockExam, userProgress: null }
    })
    
    expect(wrapper.find('.progress-section').exists()).toBe(false)
  })

  it('shows action buttons on hover', async () => {
    const wrapper = mountComponent()
    const card = wrapper.find('.exam-card')
    
    // Initially hidden
    expect(wrapper.find('.action-btn').isVisible()).toBe(false)
    
    // Simulate hover
    await card.trigger('mouseenter')
    
    // Should be visible after hover
    expect(wrapper.find('.action-btn').classes()).toContain('show')
  })
})