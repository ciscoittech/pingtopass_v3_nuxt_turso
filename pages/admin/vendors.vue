<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import StatusIndicator from '@/components/admin/StatusIndicator.vue'
import type { Vendor, VendorFormData } from '@/types/vendor'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Vendor Management' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/admin'
  },
  {
    text: 'Vendors',
    disabled: true,
    to: ''
  }
])

// State
const dialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const deleteDialog = ref(false)
const selectedBulkItems = ref<string[]>([])

// Form data
const formData = ref<VendorFormData>({
  name: '',
  description: '',
  website: '',
  logoUrl: '',
  isActive: true
})

// Selected vendor for deletion
const selectedVendor = ref<Vendor | null>(null)

// Fetch vendors
const { data: vendorsData, refresh: refreshVendors } = await useFetch('/api/vendors')
const vendors = computed(() => vendorsData.value?.data || [])

// Stats
const vendorStats = computed(() => ({
  total: vendors.value.length,
  active: vendors.value.filter(v => v.isActive).length,
  inactive: vendors.value.filter(v => !v.isActive).length
}))

// Table headers
const headers = [
  { title: 'Vendor', key: 'vendor', sortable: true },
  { title: 'Website', key: 'website', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Exams', key: 'examCount', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
]

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    isActive: true
  }
  dialog.value = true
}

const openEditDialog = (vendor: Vendor) => {
  editMode.value = true
  formData.value = {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description || '',
    website: vendor.website || '',
    logoUrl: vendor.logoUrl || '',
    isActive: vendor.isActive
  }
  dialog.value = true
}

const openDeleteDialog = (vendor: Vendor) => {
  selectedVendor.value = vendor
  deleteDialog.value = true
}

const saveVendor = async () => {
  loading.value = true
  try {
    if (editMode.value) {
      await $fetch(`/api/vendors/${formData.value.id}`, {
        method: 'PUT',
        body: formData.value
      })
    } else {
      await $fetch('/api/vendors', {
        method: 'POST',
        body: formData.value
      })
    }
    
    await refreshVendors()
    dialog.value = false
    useNuxtApp().$toast.success(editMode.value ? 'Vendor updated successfully' : 'Vendor created successfully')
  } catch (error) {
    console.error('Error saving vendor:', error)
    useNuxtApp().$toast.error('Failed to save vendor')
  }
  loading.value = false
}

const deleteVendor = async () => {
  if (!selectedVendor.value) return
  
  loading.value = true
  try {
    await $fetch(`/api/vendors/${selectedVendor.value.id}`, {
      method: 'DELETE'
    })
    
    await refreshVendors()
    deleteDialog.value = false
    selectedVendor.value = null
    useNuxtApp().$toast.success('Vendor deleted successfully')
  } catch (error) {
    console.error('Error deleting vendor:', error)
    useNuxtApp().$toast.error('Failed to delete vendor')
  }
  loading.value = false
}

const bulkActivate = async (vendorIds: string[]) => {
  // Implementation for bulk activate
  console.log('Bulk activate:', vendorIds)
}

const bulkDeactivate = async (vendorIds: string[]) => {
  // Implementation for bulk deactivate
  console.log('Bulk deactivate:', vendorIds)
}

const exportVendors = () => {
  // Implementation for export
  console.log('Export vendors')
}

const formatDate = (timestamp: number | string) => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleDateString()
  }
  return new Date(timestamp * 1000).toLocaleDateString()
}
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    
    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold">{{ vendorStats.total }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Total Vendors</p>
            </div>
            <Icon icon="solar:buildings-2-bold-duotone" size="48" class="text-primary" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-success">{{ vendorStats.active }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Active Vendors</p>
            </div>
            <Icon icon="solar:check-circle-bold-duotone" size="48" class="text-success" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="10" class="pa-6">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h3 font-weight-bold text-grey">{{ vendorStats.inactive }}</h3>
              <p class="text-body-2 text-medium-emphasis mt-1">Inactive Vendors</p>
            </div>
            <Icon icon="solar:close-circle-bold-duotone" size="48" class="text-grey" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row>
      <v-col cols="12">
        <UiParentCard title="Vendor Management">
          <AdminDataTable
            :headers="headers"
            :items="vendors"
            :loading="loading"
            table-class="vendorlist"
            search-label="Search vendors..."
            create-button-text="Add New Vendor"
            :show-select="true"
            :show-bulk-actions="true"
            empty-icon="solar:buildings-3-broken"
            empty-title="No vendors found"
            empty-subtitle="Add your first vendor to start managing certification exams"
            @create="openCreateDialog"
            @edit="openEditDialog"
            @delete="openDeleteDialog"
            @update:selected="selectedBulkItems = $event"
          >
            <!-- Toolbar Actions -->
            <template #toolbar-actions>
              <v-btn
                variant="outlined"
                size="small"
                @click="exportVendors"
              >
                <Icon icon="solar:export-line-duotone" class="mr-2" size="18" />
                Export
              </v-btn>
            </template>

            <!-- Bulk Actions -->
            <template #bulk-actions="{ selected }">
              <v-list-item @click="bulkActivate(selected)">
                <template #prepend>
                  <Icon icon="solar:check-circle-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title>Activate</v-list-item-title>
              </v-list-item>
              <v-list-item @click="bulkDeactivate(selected)">
                <template #prepend>
                  <Icon icon="solar:close-circle-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title>Deactivate</v-list-item-title>
              </v-list-item>
            </template>

            <!-- Vendor Column (Logo + Name + Description) -->
            <template #item.vendor="{ item }">
              <div class="d-flex gap-3 align-center py-2">
                <v-avatar size="48" color="grey-lighten-3">
                  <v-img v-if="item.logoUrl" :src="item.logoUrl" cover />
                  <Icon v-else icon="solar:buildings-bold" size="24" class="text-grey" />
                </v-avatar>
                <div>
                  <h6 class="text-h6 font-weight-medium">{{ item.name }}</h6>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ item.description || 'No description available' }}
                  </p>
                </div>
              </div>
            </template>

            <!-- Website Column -->
            <template #item.website="{ item }">
              <a 
                v-if="item.website"
                :href="item.website" 
                target="_blank"
                class="text-primary text-decoration-none d-inline-flex align-center gap-1"
              >
                <span>{{ item.website.replace(/^https?:\/\//, '').slice(0, 30) }}{{ item.website.length > 30 ? '...' : '' }}</span>
                <Icon icon="solar:link-round-angle-bold" size="16" />
              </a>
              <span v-else class="text-medium-emphasis">—</span>
            </template>

            <!-- Status Column -->
            <template #item.status="{ item }">
              <StatusIndicator :active="item.isActive" />
            </template>

            <!-- Exam Count Column -->
            <template #item.examCount="{ item }">
              <v-chip size="small" variant="tonal" color="primary">
                {{ item.examCount || 0 }} exams
              </v-chip>
            </template>

            <!-- Created Date Column -->
            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
          </AdminDataTable>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card elevation="10">
        <v-card-title class="text-h5 pa-6 pb-3">
          {{ editMode ? 'Edit Vendor' : 'Create New Vendor' }}
        </v-card-title>
        
        <v-card-text class="pa-6 pt-0">
          <v-container class="pa-0">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  label="Vendor Name"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Name is required']"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  placeholder="Brief description of the vendor..."
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formData.website"
                  label="Website URL"
                  variant="outlined"
                  density="comfortable"
                  placeholder="https://example.com"
                  :rules="[
                    v => !v || /^https?:\/\/.+/.test(v) || 'Must be a valid URL'
                  ]"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formData.logoUrl"
                  label="Logo URL"
                  variant="outlined"
                  density="comfortable"
                  placeholder="/logos/vendor.png"
                />
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="formData.isActive"
                  label="Active"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="flat"
            color="error"
            rounded="pill"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            @click="saveVendor"
            :loading="loading"
            :disabled="!formData.name"
          >
            {{ editMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card elevation="10">
        <v-card-text class="text-center pa-6">
          <Icon 
            icon="solar:trash-bin-minimalistic-2-broken" 
            size="64" 
            class="mb-4 text-error" 
          />
          <h5 class="text-h5 mb-2">Delete Vendor?</h5>
          <p class="text-body-1 text-medium-emphasis">
            Are you sure you want to delete <strong>{{ selectedVendor?.name }}</strong>?
          </p>
          <v-alert
            v-if="selectedVendor?.examCount && selectedVendor.examCount > 0"
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            This vendor has {{ selectedVendor.examCount }} associated exam{{ selectedVendor.examCount > 1 ? 's' : '' }}.
            Deleting this vendor will affect these exams.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="flat"
            color="error"
            rounded="pill"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            @click="deleteVendor"
            :loading="loading"
          >
            Yes, Delete
          </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>