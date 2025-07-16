<template>
  <v-card elevation="10" class="mb-4 topfilter">
    <v-card-text class="py-4 px-6">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div class="d-flex align-center flex-wrap gap-3">
          <p class="text-grey100 text-subtitle-1 font-weight-medium pr-4 mb-0">Filter by:</p>
          
          <!-- Vendor Filter -->
          <v-menu :close-on-content-click="false" class="Category_popup" transition="scale-transition">
            <template v-slot:activator="{ props }">
              <div class="cursor-pointer d-flex align-center" v-bind="props">
                <div class="font-weight-semibold text-15 text-grey200 d-flex align-center">
                  Vendor 
                  <v-badge
                    v-if="selectedVendors.length > 0"
                    :content="selectedVendors.length"
                    color="primary"
                    inline
                    class="ml-2"
                  />
                  <v-icon end>mdi-menu-down</v-icon>
                </div>
              </div>
            </template>
            <v-sheet rounded="md" width="200" elevation="10" class="mt-5 dropdown-box">
              <perfect-scrollbar style="max-height:300px">
                <v-list class="py-0 theme-list" lines="two">
                  <v-list-item color="primary" class="pa-3">
                    <v-checkbox
                      label="All Vendors"
                      density="compact"
                      v-model="allVendorsSelected"
                      color="primary"
                      hide-details
                      @update:model-value="toggleAllVendors"
                    />
                    <v-divider class="my-2" />
                    <div v-for="vendor in vendors" :key="vendor.id">
                      <v-checkbox
                        :label="vendor.name"
                        density="compact"
                        v-model="selectedVendors"
                        color="primary"
                        :value="vendor.id"
                        hide-details
                      />
                    </div>
                  </v-list-item>
                </v-list>
              </perfect-scrollbar>
            </v-sheet>
          </v-menu>
          
          <v-divider vertical class="mx-3" />
          
          <!-- Difficulty Filter -->
          <v-menu :close-on-content-click="false" class="Difficulty_popup" transition="scale-transition">
            <template v-slot:activator="{ props }">
              <div class="cursor-pointer d-flex align-center" v-bind="props">
                <div class="font-weight-semibold text-15 text-grey200 d-flex align-center">
                  Difficulty
                  <v-icon end>mdi-menu-down</v-icon>
                </div>
              </div>
            </template>
            <v-sheet rounded="md" width="180" elevation="10" class="mt-5 dropdown-box">
              <v-list class="py-0 theme-list" lines="two">
                <v-list-item color="primary" class="pa-3">
                  <v-radio-group v-model="selectedDifficulty" class="custom-radio-box">
                    <v-radio
                      v-for="level in difficultyLevels"
                      :key="level.value"
                      :label="level.label"
                      :value="level.value"
                      color="primary"
                      hide-details
                    />
                  </v-radio-group>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-menu>
          
          <v-divider vertical class="mx-3" />
          
          <!-- Progress Filter -->
          <v-menu :close-on-content-click="false" class="Progress_popup" transition="scale-transition">
            <template v-slot:activator="{ props }">
              <div class="cursor-pointer d-flex align-center" v-bind="props">
                <div class="font-weight-semibold text-15 text-grey200 d-flex align-center">
                  Progress
                  <v-icon end>mdi-menu-down</v-icon>
                </div>
              </div>
            </template>
            <v-sheet rounded="md" width="200" elevation="10" class="mt-5 dropdown-box">
              <v-list class="py-0 theme-list" lines="two">
                <v-list-item color="primary" class="pa-3">
                  <v-radio-group v-model="selectedProgress" class="custom-radio-box">
                    <v-radio
                      v-for="range in progressRanges"
                      :key="range.value"
                      :label="range.label"
                      :value="range.value"
                      color="primary"
                      hide-details
                    />
                  </v-radio-group>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-menu>
          
          <v-divider vertical class="mx-3" />
          
          <!-- Status Filter -->
          <v-menu :close-on-content-click="false" class="Status_popup" transition="scale-transition">
            <template v-slot:activator="{ props }">
              <div class="cursor-pointer d-flex align-center" v-bind="props">
                <div class="font-weight-semibold text-15 text-grey200 d-flex align-center">
                  Status
                  <v-icon end>mdi-menu-down</v-icon>
                </div>
              </div>
            </template>
            <v-sheet rounded="md" width="180" elevation="10" class="mt-5 dropdown-box">
              <v-list class="py-0 theme-list" lines="two">
                <v-list-item color="primary" class="pa-3">
                  <v-checkbox
                    v-for="status in statusOptions"
                    :key="status.value"
                    :label="status.label"
                    v-model="selectedStatuses"
                    :value="status.value"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-menu>
        </div>
        
        <div>
          <v-btn
            color="primary"
            @click="resetFilters"
            size="large"
            rounded="pill"
            :disabled="!hasActiveFilters"
          >
            Reset Filters
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Vendor {
  id: string
  name: string
}

interface Props {
  vendors?: Vendor[]
}

const props = withDefaults(defineProps<Props>(), {
  vendors: () => []
})

const emit = defineEmits<{
  'update:filters': [filters: {
    vendors: string[]
    difficulty: string
    progress: string
    statuses: string[]
  }]
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

// Selected values
const selectedVendors = ref<string[]>([])
const selectedDifficulty = ref('all')
const selectedProgress = ref('all')
const selectedStatuses = ref<string[]>(['active'])
const allVendorsSelected = ref(true)

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

const resetFilters = () => {
  selectedVendors.value = []
  selectedDifficulty.value = 'all'
  selectedProgress.value = 'all'
  selectedStatuses.value = ['active']
  allVendorsSelected.value = true
  emitFilters()
}

const emitFilters = () => {
  emit('update:filters', {
    vendors: selectedVendors.value,
    difficulty: selectedDifficulty.value,
    progress: selectedProgress.value,
    statuses: selectedStatuses.value
  })
}

// Watch for changes
watch([selectedVendors, selectedDifficulty, selectedProgress, selectedStatuses], () => {
  allVendorsSelected.value = selectedVendors.value.length === 0
  emitFilters()
}, { deep: true })
</script>

<style lang="scss" scoped>
.topfilter {
  position: sticky;
  top: 0;
  z-index: 10;
}

.cursor-pointer {
  cursor: pointer;
  user-select: none;
  
  &:hover {
    opacity: 0.8;
  }
}

.dropdown-box {
  margin-top: 8px;
}

.custom-radio-box {
  :deep(.v-selection-control) {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.theme-list {
  :deep(.v-list-item) {
    min-height: auto;
  }
}
</style>