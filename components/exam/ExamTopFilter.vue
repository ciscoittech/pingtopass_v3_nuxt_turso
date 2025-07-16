<template>
  <v-card elevation="0" class="mb-6">
    <v-card-text class="pa-4">
      <v-row align="center" no-gutters>
        <!-- Filters -->
        <v-col cols="12" sm="6" md="3" class="pr-2">
          <v-select
            v-model="selectedVendor"
            :items="vendors"
            item-title="name"
            item-value="id"
            label="Vendor"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @update:model-value="onFilterChange"
          />
        </v-col>

        <v-col cols="12" sm="6" md="3" class="px-2">
          <v-select
            v-model="selectedDifficulty"
            :items="difficulties"
            label="Difficulty"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @update:model-value="onFilterChange"
          />
        </v-col>

        <v-col cols="12" sm="6" md="3" class="px-2">
          <v-select
            v-model="selectedStatus"
            :items="statuses"
            label="Status"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            @update:model-value="onFilterChange"
          />
        </v-col>

        <!-- Sort Dropdown -->
        <v-col cols="12" sm="6" md="3" class="pl-2">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            item-title="text"
            item-value="value"
            label="Sort by"
            variant="outlined"
            density="comfortable"
            hide-details
            @update:model-value="onSortChange"
          >
            <template #prepend-inner>
              <Icon icon="solar:sort-vertical-line-duotone" size="20" />
            </template>
          </v-select>
        </v-col>
      </v-row>

      <!-- Active Filters Display -->
      <div v-if="hasActiveFilters" class="mt-3 d-flex align-center gap-2 flex-wrap">
        <span class="text-caption text-grey100">Active filters:</span>
        
        <v-chip
          v-if="selectedVendor"
          size="small"
          closable
          @click:close="selectedVendor = null; onFilterChange()"
        >
          {{ getVendorName(selectedVendor) }}
        </v-chip>
        
        <v-chip
          v-if="selectedDifficulty"
          size="small"
          closable
          @click:close="selectedDifficulty = null; onFilterChange()"
        >
          {{ selectedDifficulty }}
        </v-chip>
        
        <v-chip
          v-if="selectedStatus"
          size="small"
          closable
          @click:close="selectedStatus = null; onFilterChange()"
        >
          {{ selectedStatus }}
        </v-chip>

        <v-btn
          variant="text"
          size="small"
          color="primary"
          @click="clearAllFilters"
        >
          Clear all
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Vendor } from '@/types/vendor'

interface Props {
  vendors?: Vendor[]
  modelValue?: {
    vendor?: string | null
    difficulty?: string | null
    status?: string | null
    sortBy?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  vendors: () => [],
  modelValue: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
  'filter': [filters: any]
  'sort': [sortBy: string]
}>()

// Local state
const selectedVendor = ref(props.modelValue.vendor || null)
const selectedDifficulty = ref(props.modelValue.difficulty || null)
const selectedStatus = ref(props.modelValue.status || null)
const sortBy = ref(props.modelValue.sortBy || 'popularity')

// Options
const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const statuses = ['Not Started', 'In Progress', 'Completed']

const sortOptions = [
  { text: 'Most Popular', value: 'popularity' },
  { text: 'Recently Added', value: 'recent' },
  { text: 'Progress: High to Low', value: 'progress-desc' },
  { text: 'Progress: Low to High', value: 'progress-asc' },
  { text: 'Name: A to Z', value: 'name-asc' },
  { text: 'Name: Z to A', value: 'name-desc' }
]

// Computed
const hasActiveFilters = computed(() => {
  return selectedVendor.value || selectedDifficulty.value || selectedStatus.value
})

// Methods
const getVendorName = (vendorId: string) => {
  return props.vendors.find(v => v.id === vendorId)?.name || vendorId
}

const onFilterChange = () => {
  updateFilters()
  emit('filter', {
    vendor: selectedVendor.value,
    difficulty: selectedDifficulty.value,
    status: selectedStatus.value
  })
}

const onSortChange = () => {
  updateFilters()
  emit('sort', sortBy.value)
}

const updateFilters = () => {
  emit('update:modelValue', {
    vendor: selectedVendor.value,
    difficulty: selectedDifficulty.value,
    status: selectedStatus.value,
    sortBy: sortBy.value
  })
}

const clearAllFilters = () => {
  selectedVendor.value = null
  selectedDifficulty.value = null
  selectedStatus.value = null
  updateFilters()
}

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  selectedVendor.value = newVal.vendor || null
  selectedDifficulty.value = newVal.difficulty || null
  selectedStatus.value = newVal.status || null
  sortBy.value = newVal.sortBy || 'popularity'
}, { deep: true })
</script>

<style scoped>
/* Equal spacing for filter columns */
:deep(.v-select) {
  .v-field__input {
    font-size: 0.875rem;
  }
}

/* Ensure consistent heights */
:deep(.v-field) {
  min-height: 40px;
}

/* Better mobile responsiveness */
@media (max-width: 600px) {
  .v-col {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}
</style>