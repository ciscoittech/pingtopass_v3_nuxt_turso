import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ExamFilters from '~/components/exam/ExamFilters.vue'

const vuetify = createVuetify()

describe('ExamFilters', () => {
  const mockVendors = [
    { id: 'microsoft', name: 'Microsoft' },
    { id: 'aws', name: 'Amazon AWS' },
    { id: 'google', name: 'Google Cloud' }
  ]

  const mockFilters = {
    search: '',
    vendors: [],
    difficulty: 'all',
    progress: 'all',
    statuses: ['active'],
    sortBy: 'popular'
  }

  const mountComponent = (props = {}) => {
    return mount(ExamFilters, {
      props: {
        vendors: mockVendors,
        filters: mockFilters,
        hasActiveFilters: false,
        ...props
      },
      global: {
        plugins: [vuetify]
      }
    })
  }

  it('renders all filter components', () => {
    const wrapper = mountComponent()
    
    // Search field
    expect(wrapper.find('.search-field').exists()).toBe(true)
    
    // Filter buttons
    expect(wrapper.find('.vendor-menu').exists()).toBe(true)
    expect(wrapper.find('.difficulty-menu').exists()).toBe(true)
    expect(wrapper.find('.progress-menu').exists()).toBe(true)
    expect(wrapper.find('.status-menu').exists()).toBe(true)
    
    // Sort select
    expect(wrapper.find('.sort-select').exists()).toBe(true)
  })

  it('emits update:search event on search input', async () => {
    const wrapper = mountComponent()
    const searchInput = wrapper.find('.search-field input')
    
    await searchInput.setValue('Azure')
    await searchInput.trigger('input')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 400))
    
    expect(wrapper.emitted('update:search')).toBeTruthy()
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['Azure'])
  })

  it('emits update:filters when vendor selected', async () => {
    const wrapper = mountComponent()
    const vendorBtn = wrapper.find('.vendor-menu')
    
    await vendorBtn.trigger('click')
    
    // Find and click a vendor checkbox in the menu
    const vendorCheckbox = wrapper.find('[value="microsoft"]')
    await vendorCheckbox.trigger('click')
    
    expect(wrapper.emitted('update:filters')).toBeTruthy()
    expect(wrapper.emitted('update:filters')?.[0][0]).toMatchObject({
      vendors: ['microsoft']
    })
  })

  it('emits update:sort when sort changed', async () => {
    const wrapper = mountComponent()
    const sortSelect = wrapper.find('.sort-select')
    
    await sortSelect.setValue('name')
    
    expect(wrapper.emitted('update:sort')).toBeTruthy()
    expect(wrapper.emitted('update:sort')?.[0]).toEqual(['name'])
  })

  it('shows clear filters button when filters active', () => {
    const wrapper = mountComponent({
      hasActiveFilters: true
    })
    
    const clearBtn = wrapper.find('.clear-filters-btn')
    expect(clearBtn.exists()).toBe(true)
    expect(clearBtn.isVisible()).toBe(true)
  })

  it('emits reset event when clear filters clicked', async () => {
    const wrapper = mountComponent({
      hasActiveFilters: true
    })
    
    const clearBtn = wrapper.find('.clear-filters-btn')
    await clearBtn.trigger('click')
    
    expect(wrapper.emitted('reset')).toBeTruthy()
  })

  it('displays active filter counts correctly', () => {
    const wrapper = mountComponent({
      filters: {
        ...mockFilters,
        vendors: ['microsoft', 'aws'],
        difficulty: 'intermediate'
      }
    })
    
    const vendorBadge = wrapper.find('.vendor-menu .filter-count')
    expect(vendorBadge.text()).toBe('2')
  })

  it('updates difficulty filter correctly', async () => {
    const wrapper = mountComponent()
    const difficultyBtn = wrapper.find('.difficulty-menu')
    
    await difficultyBtn.trigger('click')
    
    const beginnerOption = wrapper.find('[value="beginner"]')
    await beginnerOption.trigger('click')
    
    expect(wrapper.emitted('update:filters')).toBeTruthy()
    expect(wrapper.emitted('update:filters')?.[0][0]).toMatchObject({
      difficulty: 'beginner'
    })
  })

  it('handles multiple status selections', async () => {
    const wrapper = mountComponent()
    const statusBtn = wrapper.find('.status-menu')
    
    await statusBtn.trigger('click')
    
    // Select additional statuses
    const bookmarkedCheckbox = wrapper.find('[value="bookmarked"]')
    await bookmarkedCheckbox.trigger('click')
    
    expect(wrapper.emitted('update:filters')).toBeTruthy()
    expect(wrapper.emitted('update:filters')?.[0][0]).toMatchObject({
      statuses: ['active', 'bookmarked']
    })
  })
})