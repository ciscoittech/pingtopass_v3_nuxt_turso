<template>
  <div class="mobile-filters pa-4">
    <h3 class="text-h6 font-weight-bold mb-4">Filters</h3>
    
    <!-- Vendor Filter -->
    <div class="filter-section mb-4">
      <h4 class="text-subtitle-1 font-weight-semibold mb-3">Vendor</h4>
      <v-checkbox
        label="All Vendors"
        v-model="allVendorsSelected"
        color="primary"
        density="compact"
        hide-details
        @update:model-value="toggleAllVendors"
      />
      <v-divider class="my-2" />
      <v-checkbox
        v-for="vendor in vendors"
        :key="vendor.id"
        :label="vendor.name"
        v-model="selectedVendors"
        :value="vendor.id"
        color="primary"
        density="compact"
        hide-details
        class="mb-2"
      />
    </div>
    
    <v-divider class="mb-4" />
    
    <!-- Difficulty Filter -->
    <div class="filter-section mb-4">
      <h4 class="text-subtitle-1 font-weight-semibold mb-3">Difficulty</h4>
      <v-radio-group
        v-model="selectedDifficulty"
        color="primary"
        density="compact"
        hide-details
      >
        <v-radio
          v-for="level in difficultyLevels"
          :key="level.value"
          :label="level.label"
          :value="level.value"
        />
      </v-radio-group>
    </div>
    
    <v-divider class="mb-4" />
    
    <!-- Progress Filter -->
    <div class="filter-section mb-4">
      <h4 class="text-subtitle-1 font-weight-semibold mb-3">Progress</h4>
      <v-radio-group
        v-model="selectedProgress"
        color="primary"
        density="compact"
        hide-details
      >
        <v-radio
          v-for="range in progressRanges"
          :key="range.value"
          :label="range.label"
          :value="range.value"
        />
      </v-radio-group>
    </div>
    
    <v-divider class="mb-4" />
    
    <!-- Status Filter -->
    <div class="filter-section mb-4">
      <h4 class="text-subtitle-1 font-weight-semibold mb-3">Status</h4>
      <v-checkbox
        v-for="status in statusOptions"
        :key="status.value"
        :label="status.label"
        v-model="selectedStatuses"
        :value="status.value"
        color="primary"
        density="compact"
        hide-details
        class="mb-2"
      />
    </div>
    
    <!-- Action Buttons -->
    <div class="filter-actions mt-6">
      <v-btn
        color="primary"
        block
        @click="applyFilters"
        class="mb-2"
      >
        Apply Filters
      </v-btn>
      <v-btn
        variant="outlined"
        block
        @click="resetFilters"
        :disabled="!hasActiveFilters"
      >
        Reset Filters
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Vendor {
  id: string
  name: string
}

interface Props {
  vendors?: Vendor[]
  modelValue?: {
    vendors: string[]
    difficulty: string
    progress: string
    statuses: string[]
  }
}

const props = withDefaults(defineProps<Props>(), {
  vendors: () => [],
  modelValue: () => ({
    vendors: [],
    difficulty: 'all',
    progress: 'all',
    statuses: ['active']
  })
})

const emit = defineEmits<{
  'update:modelValue': [filters: {
    vendors: string[]
    difficulty: string
    progress: string
    statuses: string[]
  }]
  'close': []
}>()

// Filter options
const difficultyLevels = [
  { label: 'All Levels', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' }
]

const progressRanges = [
  { label: 'All Progress', value: 'all' },
  { label: 'Not Started', value: '0' },
  { label: '1-25%', value: '1-25' },
  { label: '26-50%', value: '26-50' },
  { label: '51-75%', value: '51-75' },
  { label: '76-99%', value: '76-99' },
  { label: 'Completed', value: '100' }
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Expired', value: 'expired' },
  { label: 'Bookmarked', value: 'bookmarked' }
]

// Selected values - initialize from props
const selectedVendors = ref<string[]>(props.modelValue.vendors)
const selectedDifficulty = ref(props.modelValue.difficulty)
const selectedProgress = ref(props.modelValue.progress)
const selectedStatuses = ref<string[]>(props.modelValue.statuses)
const allVendorsSelected = ref(props.modelValue.vendors.length === 0)

// Computed
const hasActiveFilters = computed(() => {
  return selectedVendors.value.length > 0 ||
    selectedDifficulty.value !== 'all' ||
    selectedProgress.value !== 'all' ||
    selectedStatuses.value.length !== 1 ||
    selectedStatuses.value[0] !== 'active'
})

// Methods
const toggleAllVendors = (value: boolean) => {
  if (value) {
    selectedVendors.value = []
  }
}

const applyFilters = () => {
  emit('update:modelValue', {
    vendors: selectedVendors.value,
    difficulty: selectedDifficulty.value,
    progress: selectedProgress.value,
    statuses: selectedStatuses.value
  })
  emit('close')
}

const resetFilters = () => {
  selectedVendors.value = []
  selectedDifficulty.value = 'all'
  selectedProgress.value = 'all'
  selectedStatuses.value = ['active']
  allVendorsSelected.value = true
  applyFilters()
}

// Watch for vendor selection changes
watch(selectedVendors, () => {
  allVendorsSelected.value = selectedVendors.value.length === 0
}, { deep: true })
</script>

<style lang="scss" scoped>
.mobile-filters {
  height: 100%;
  overflow-y: auto;
}

.filter-section {
  :deep(.v-selection-control) {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.filter-actions {
  position: sticky;
  bottom: 0;
  background: rgb(var(--v-theme-surface));
  padding: 16px 0;
  margin: -16px -16px 0;
  padding: 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>