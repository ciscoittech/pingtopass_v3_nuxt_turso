<template>
  <div>
    <div class="d-flex align-center justify-between mb-4">
      <h2 class="text-h5">Competitor Management</h2>
      <v-btn color="primary" @click="showAddDialog = true">
        <v-icon start>mdi-plus</v-icon>
        Add Competitor
      </v-btn>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.category"
          :items="categoryOptions"
          label="Category"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.priority"
          :items="priorityOptions"
          label="Priority"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.status"
          :items="statusOptions"
          label="Status"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="searchQuery"
          label="Search competitors..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
        />
      </v-col>
    </v-row>

    <!-- Competitors Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredCompetitors"
        :loading="loading"
        :search="searchQuery"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:item.username="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3">
              <v-img
                :src="`https://unavatar.io/twitter/${item.username}`"
                :alt="item.username"
              />
            </v-avatar>
            <div>
              <div class="font-weight-medium">@{{ item.username }}</div>
              <div class="text-caption text-grey">{{ item.name }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.category="{ item }">
          <v-chip
            :color="getCategoryColor(item.category)"
            size="small"
            variant="outlined"
          >
            {{ item.category }}
          </v-chip>
        </template>

        <template v-slot:item.priority="{ item }">
          <v-chip
            :color="getPriorityColor(item.priority)"
            size="small"
          >
            {{ item.priority }}
          </v-chip>
        </template>

        <template v-slot:item.lastAnalyzed="{ item }">
          <span v-if="item.lastAnalyzed">
            {{ formatDate(item.lastAnalyzed) }}
          </span>
          <span v-else class="text-grey">Never</span>
        </template>

        <template v-slot:item.isActive="{ item }">
          <v-switch
            v-model="item.isActive"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="updateCompetitorStatus(item)"
          />
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="viewCompetitor(item)"
            />
            <v-btn
              icon="mdi-radar"
              size="small"
              variant="text"
              color="primary"
              :loading="analyzingIds.has(item.id)"
              @click="analyzeCompetitor(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editCompetitor(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteCompetitor(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Competitor Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingCompetitor ? 'Edit' : 'Add' }} Competitor
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="formData.username"
              label="Twitter Username"
              prepend-inner-icon="mdi-at"
              :rules="[v => !!v || 'Username is required']"
              hint="Without the @ symbol"
              persistent-hint
            />

            <v-text-field
              v-model="formData.name"
              label="Display Name"
              :rules="[v => !!v || 'Name is required']"
              class="mt-4"
            />

            <v-textarea
              v-model="formData.description"
              label="Description"
              rows="3"
              class="mt-4"
            />

            <v-select
              v-model="formData.category"
              :items="categoryOptions"
              label="Category"
              :rules="[v => !!v || 'Category is required']"
              class="mt-4"
            />

            <v-select
              v-model="formData.priority"
              :items="priorityOptions"
              label="Priority"
              class="mt-4"
            />

            <v-textarea
              v-model="formData.notes"
              label="Notes"
              rows="2"
              class="mt-4"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!valid"
            @click="saveCompetitor"
          >
            {{ editingCompetitor ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Competitor Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="800">
      <v-card v-if="selectedCompetitor">
        <v-card-title class="d-flex align-center">
          <v-avatar size="40" class="mr-3">
            <v-img
              :src="`https://unavatar.io/twitter/${selectedCompetitor.username}`"
              :alt="selectedCompetitor.username"
            />
          </v-avatar>
          <div>
            <div>{{ selectedCompetitor.name }}</div>
            <div class="text-caption">@{{ selectedCompetitor.username }}</div>
          </div>
          <v-spacer />
          <v-btn icon @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h4>Information</h4>
              <p v-if="selectedCompetitor.description">
                {{ selectedCompetitor.description }}
              </p>
              <div class="d-flex gap-2 my-2">
                <v-chip :color="getCategoryColor(selectedCompetitor.category)" size="small">
                  {{ selectedCompetitor.category }}
                </v-chip>
                <v-chip :color="getPriorityColor(selectedCompetitor.priority)" size="small">
                  {{ selectedCompetitor.priority }}
                </v-chip>
              </div>
              <p v-if="selectedCompetitor.notes" class="text-caption">
                <strong>Notes:</strong> {{ selectedCompetitor.notes }}
              </p>
            </v-col>
            <v-col cols="12" md="6">
              <h4>Analytics</h4>
              <div v-if="selectedCompetitor.lastAnalyzed">
                <p><strong>Last Analyzed:</strong> {{ formatDate(selectedCompetitor.lastAnalyzed) }}</p>
                <!-- Add recent metrics here -->
              </div>
              <p v-else class="text-grey">No analysis data available</p>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="primary"
            :loading="analyzingIds.has(selectedCompetitor.id)"
            @click="analyzeCompetitor(selectedCompetitor)"
          >
            <v-icon start>mdi-radar</v-icon>
            Analyze Now
          </v-btn>
          <v-spacer />
          <v-btn @click="editCompetitor(selectedCompetitor)">
            <v-icon start>mdi-pencil</v-icon>
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Competitor {
  id: string
  username: string
  name: string
  description?: string
  category: string
  priority: string
  isActive: boolean
  lastAnalyzed?: number
  notes?: string
  addedAt: number
}

const props = defineProps<{
  competitors: Competitor[]
}>()

const emit = defineEmits<{
  competitorAdded: []
  competitorUpdated: []
  analysisStarted: []
  analysisCompleted: [data: any]
}>()

// Reactive data
const loading = ref(false)
const saving = ref(false)
const valid = ref(false)
const showAddDialog = ref(false)
const showDetailsDialog = ref(false)
const editingCompetitor = ref<Competitor | null>(null)
const selectedCompetitor = ref<Competitor | null>(null)
const analyzingIds = ref(new Set<string>())
const searchQuery = ref('')

const filters = ref({
  category: '',
  priority: '',
  status: ''
})

const formData = ref({
  username: '',
  name: '',
  description: '',
  category: '',
  priority: 'medium',
  notes: ''
})

// Static data
const headers = [
  { title: 'Competitor', key: 'username', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Priority', key: 'priority', sortable: true },
  { title: 'Last Analyzed', key: 'lastAnalyzed', sortable: true },
  { title: 'Active', key: 'isActive', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false }
]

const categoryOptions = [
  { title: 'Direct Competitor', value: 'direct' },
  { title: 'Indirect Competitor', value: 'indirect' },
  { title: 'Industry Influencer', value: 'influencer' }
]

const priorityOptions = [
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
]

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' }
]

// Computed
const filteredCompetitors = computed(() => {
  let filtered = [...props.competitors]

  if (filters.value.category) {
    filtered = filtered.filter(c => c.category === filters.value.category)
  }

  if (filters.value.priority) {
    filtered = filtered.filter(c => c.priority === filters.value.priority)
  }

  if (filters.value.status) {
    const isActive = filters.value.status === 'active'
    filtered = filtered.filter(c => c.isActive === isActive)
  }

  return filtered
})

// Methods
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'direct': return 'error'
    case 'indirect': return 'warning'
    case 'influencer': return 'info'
    default: return 'grey'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'grey'
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString()
}

const resetForm = () => {
  formData.value = {
    username: '',
    name: '',
    description: '',
    category: '',
    priority: 'medium',
    notes: ''
  }
  editingCompetitor.value = null
}

const closeDialog = () => {
  showAddDialog.value = false
  resetForm()
}

const editCompetitor = (competitor: Competitor) => {
  editingCompetitor.value = competitor
  formData.value = {
    username: competitor.username,
    name: competitor.name,
    description: competitor.description || '',
    category: competitor.category,
    priority: competitor.priority,
    notes: competitor.notes || ''
  }
  showAddDialog.value = true
}

const viewCompetitor = (competitor: Competitor) => {
  selectedCompetitor.value = competitor
  showDetailsDialog.value = true
}

const saveCompetitor = async () => {
  if (!valid.value) return

  saving.value = true

  try {
    if (editingCompetitor.value) {
      // Update existing competitor
      await $fetch(`/api/admin/twitter/competitors/${editingCompetitor.value.id}`, {
        method: 'PUT',
        body: formData.value
      })
      useNuxtApp().$toast?.success('Competitor updated successfully')
    } else {
      // Add new competitor
      await $fetch('/api/admin/twitter/competitors', {
        method: 'POST',
        body: formData.value
      })
      useNuxtApp().$toast?.success('Competitor added successfully')
    }

    emit('competitorUpdated')
    closeDialog()

  } catch (error: any) {
    console.error('Failed to save competitor:', error)
    useNuxtApp().$toast?.error(error.data?.message || 'Failed to save competitor')
  } finally {
    saving.value = false
  }
}

const updateCompetitorStatus = async (competitor: Competitor) => {
  try {
    await $fetch(`/api/admin/twitter/competitors/${competitor.id}`, {
      method: 'PUT',
      body: { isActive: competitor.isActive }
    })
    
    useNuxtApp().$toast?.success(
      `Competitor ${competitor.isActive ? 'activated' : 'deactivated'}`
    )
    
  } catch (error: any) {
    console.error('Failed to update competitor status:', error)
    // Revert the switch
    competitor.isActive = !competitor.isActive
    useNuxtApp().$toast?.error('Failed to update competitor status')
  }
}

const analyzeCompetitor = async (competitor: Competitor) => {
  analyzingIds.value.add(competitor.id)
  emit('analysisStarted')

  try {
    const { data } = await $fetch('/api/admin/twitter/analyze', {
      method: 'POST',
      body: {
        competitorIds: [competitor.id],
        includeRecommendations: true
      }
    })

    useNuxtApp().$toast?.success(
      `Analysis complete for @${competitor.username}`
    )

    emit('analysisCompleted', data)

  } catch (error: any) {
    console.error('Analysis failed:', error)
    useNuxtApp().$toast?.error(error.data?.message || 'Analysis failed')
  } finally {
    analyzingIds.value.delete(competitor.id)
  }
}

const deleteCompetitor = async (competitor: Competitor) => {
  const confirmed = await new Promise(resolve => {
    // Simple confirmation - in real app, use a proper dialog
    resolve(confirm(`Delete competitor @${competitor.username}?`))
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/admin/twitter/competitors/${competitor.id}`, {
      method: 'DELETE'
    })

    useNuxtApp().$toast?.success('Competitor deleted successfully')
    emit('competitorUpdated')

  } catch (error: any) {
    console.error('Failed to delete competitor:', error)
    useNuxtApp().$toast?.error('Failed to delete competitor')
  }
}
</script>