<template>
  <v-data-table
    :class="`rounded-md datatabels ${tableClass}`"
    :headers="headers"
    :items="items"
    v-model:search="search"
    :items-per-page="itemsPerPage"
    :loading="loading"
    :show-select="showSelect"
    v-model="selected"
    item-value="id"
    color="primary"
    :sort-by="sortBy"
  >
    <!-- Top toolbar with search and actions -->
    <template v-slot:top>
      <v-toolbar class="productlist-table bg-transparent" flat>
        <div class="d-md-flex block justify-space-between w-100 pb-6 align-center">
          <!-- Search field -->
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            :label="searchLabel"
            single-line
            hide-details
            density="compact"
            variant="outlined"
            class="mb-md-0 mb-3"
            style="max-width: 300px;"
          />
          
          <!-- Action buttons -->
          <div class="d-flex gap-2 align-center">
            <slot name="toolbar-actions" />
            
            <!-- Bulk actions dropdown -->
            <v-menu v-if="showBulkActions && selected.length > 0">
              <template v-slot:activator="{ props }">
                <v-btn
                  variant="outlined"
                  v-bind="props"
                  size="small"
                >
                  <Icon icon="solar:menu-dots-bold" class="mr-2" size="18" />
                  Actions ({{ selected.length }})
                </v-btn>
              </template>
              <v-list density="compact">
                <slot name="bulk-actions" :selected="selected" />
              </v-list>
            </v-menu>
            
            <!-- Create button -->
            <v-btn 
              v-if="showCreateButton"
              color="primary" 
              variant="flat" 
              rounded="pill"
              @click="$emit('create')"
            >
              <Icon icon="solar:add-circle-line-duotone" class="mr-2" size="20" />
              {{ createButtonText }}
            </v-btn>
          </div>
        </div>
      </v-toolbar>
    </template>

    <!-- Pass through all slots -->
    <template v-for="(_, slot) in $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>

    <!-- Actions column -->
    <template v-slot:item.actions="{ item }">
      <div class="d-flex gap-1">
        <slot name="item-actions" :item="item">
          <v-btn
            icon
            size="small"
            variant="text"
            @click="$emit('edit', item)"
          >
            <Icon icon="solar:pen-bold-duotone" size="18" class="text-primary" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="$emit('delete', item)"
          >
            <Icon icon="solar:trash-bin-trash-bold-duotone" size="18" class="text-error" />
            <v-tooltip activator="parent" location="top">Delete</v-tooltip>
          </v-btn>
        </slot>
      </div>
    </template>

    <!-- No data state -->
    <template v-slot:no-data>
      <AdminEmptyState
        v-if="!loading"
        :icon="emptyIcon"
        :title="emptyTitle"
        :subtitle="emptySubtitle"
        :action-text="showCreateButton ? createButtonText : undefined"
        @action="$emit('create')"
      />
    </template>

    <!-- Loading state -->
    <template v-slot:loading>
      <v-skeleton-loader
        v-for="i in 5"
        :key="i"
        :type="'table-row'"
        class="mb-2"
      />
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import AdminEmptyState from './AdminEmptyState.vue'

interface Props {
  headers: any[]
  items: any[]
  loading?: boolean
  tableClass?: string
  searchLabel?: string
  itemsPerPage?: number
  showSelect?: boolean
  showCreateButton?: boolean
  createButtonText?: string
  showBulkActions?: boolean
  emptyIcon?: string
  emptyTitle?: string
  emptySubtitle?: string
  sortBy?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  tableClass: '',
  searchLabel: 'Search',
  itemsPerPage: 10,
  showSelect: false,
  showCreateButton: true,
  createButtonText: 'Add New',
  showBulkActions: false,
  emptyIcon: 'solar:box-minimalistic-broken',
  emptyTitle: 'No data found',
  emptySubtitle: 'Try adjusting your search or filters',
  sortBy: () => []
})

const emit = defineEmits<{
  create: []
  edit: [item: any]
  delete: [item: any]
  'update:selected': [items: any[]]
}>()

const search = ref('')
const selected = ref<any[]>([])

// Watch selected items and emit changes
watch(selected, (newVal) => {
  emit('update:selected', newVal)
})
</script>

<style scoped>
.datatabels :deep(.v-table__wrapper) {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
}

.productlist-table {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>