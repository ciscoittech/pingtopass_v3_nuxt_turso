<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

// State
const dialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const deleteDialog = ref(false)

// Form data
const formData = ref({
  id: '',
  name: '',
  description: '',
  website: '',
  logoUrl: ''
})

// Selected vendor for deletion
const selectedVendor = ref(null)

// Fetch vendors
const { data: vendorsData, refresh: refreshVendors } = await useFetch('/api/vendors')
const vendors = computed(() => vendorsData.value?.data || [])

// Table headers
const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Website', key: 'website', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
]

// Methods
const openCreateDialog = () => {
  editMode.value = false
  formData.value = {
    id: '',
    name: '',
    description: '',
    website: '',
    logoUrl: ''
  }
  dialog.value = true
}

const openEditDialog = (vendor: any) => {
  editMode.value = true
  formData.value = { ...vendor }
  dialog.value = true
}

const openDeleteDialog = (vendor: any) => {
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
  } catch (error) {
    console.error('Error saving vendor:', error)
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
  } catch (error) {
    console.error('Error deleting vendor:', error)
  }
  loading.value = false
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString()
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">
          Vendor Management
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          Manage certification vendors and companies
        </p>
      </div>
      
      <v-btn
        color="primary"
        @click="openCreateDialog"
        prepend-icon="mdi-plus"
      >
        Add Vendor
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="vendors"
        :loading="loading"
        item-key="id"
      >
        <template v-slot:item.website="{ item }">
          <a 
            v-if="item.website"
            :href="item.website" 
            target="_blank"
            class="text-primary text-decoration-none"
          >
            {{ item.website }}
            <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
          </a>
          <span v-else class="text-grey">-</span>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Vendor' : 'Create Vendor' }}
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="saveVendor">
            <v-text-field
              v-model="formData.name"
              label="Vendor Name *"
              variant="outlined"
              required
              class="mb-4"
            />
            
            <v-textarea
              v-model="formData.description"
              label="Description"
              variant="outlined"
              rows="3"
              class="mb-4"
            />
            
            <v-text-field
              v-model="formData.website"
              label="Website URL"
              variant="outlined"
              placeholder="https://example.com"
              class="mb-4"
            />
            
            <v-text-field
              v-model="formData.logoUrl"
              label="Logo URL"
              variant="outlined"
              placeholder="/logos/vendor.png"
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveVendor"
            :loading="loading"
          >
            {{ editMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ selectedVendor?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteVendor"
            :loading="loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>