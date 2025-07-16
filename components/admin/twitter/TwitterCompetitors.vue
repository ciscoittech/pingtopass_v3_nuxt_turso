<template>
  <div>
    <!-- Add Competitor Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text>
            <h4 class="text-h6 mb-4">Add Competitor</h4>
            <v-form @submit.prevent="addCompetitor">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newCompetitor.username"
                    label="Twitter Username"
                    placeholder="@username"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-at"
                    :rules="[v => !!v || 'Username is required']"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="newCompetitor.category"
                    label="Category"
                    :items="categories"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    :loading="addingCompetitor"
                  >
                    Add
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Competitors List -->
    <v-row>
      <v-col cols="12">
        <h4 class="text-h6 mb-4">Active Competitors</h4>
      </v-col>
      <v-col
        v-for="competitor in activeCompetitors"
        :key="competitor.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          variant="outlined"
          :class="{ 'border-primary': competitor.isAnalyzing }"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar :color="competitor.isActive ? 'primary' : 'grey'" variant="tonal">
                <v-icon>mdi-twitter</v-icon>
              </v-avatar>
            </template>
            <v-card-title>{{ competitor.username }}</v-card-title>
            <v-card-subtitle>{{ competitor.name || 'Loading...' }}</v-card-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="competitor.isActive"
                density="compact"
                hide-details
                @update:model-value="toggleCompetitor(competitor)"
              />
            </template>
          </v-card-item>

          <v-card-text>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-account-group</v-icon>
                  {{ formatNumber(competitor.metrics?.followers || 0) }} followers
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-twitter</v-icon>
                  {{ formatNumber(competitor.metrics?.tweets || 0) }} tweets
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-chart-line</v-icon>
                  {{ competitor.metrics?.engagementRate || 0 }}% engagement
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0" v-if="competitor.lastAnalyzed">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-update</v-icon>
                  Last analyzed {{ formatTimeAgo(competitor.lastAnalyzed) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>

            <div v-if="competitor.category" class="mt-3">
              <v-chip size="small" variant="tonal">
                {{ competitor.category }}
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              :loading="competitor.isAnalyzing"
              @click="analyzeCompetitor(competitor)"
            >
              <v-icon start size="16">mdi-magnify</v-icon>
              Analyze
            </v-btn>
            <v-btn
              color="error"
              variant="text"
              size="small"
              @click="removeCompetitor(competitor)"
            >
              Remove
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-if="competitors.length === 0">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" class="mb-4 text-grey-lighten-1">mdi-account-search</v-icon>
            <h3 class="text-h5 mb-2">No Competitors Added</h3>
            <p class="text-body-2 text-grey">
              Add competitor Twitter accounts to start analyzing their strategies
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
interface Competitor {
  id: string
  username: string
  name?: string
  category?: string
  isActive: boolean
  isAnalyzing?: boolean
  lastAnalyzed?: Date
  metrics?: {
    followers: number
    tweets: number
    engagementRate: number
  }
}

interface Props {
  competitors?: Competitor[]
}

const props = withDefaults(defineProps<Props>(), {
  competitors: () => []
})

const emit = defineEmits<{
  'competitor-added': [username: string, category: string]
  'competitor-updated': [competitor: Competitor]
  'analysis-started': [competitorId: string]
  'analysis-completed': [data: any]
}>()

// Local state
const addingCompetitor = ref(false)
const newCompetitor = ref({
  username: '',
  category: ''
})

const categories = [
  'Direct Competitor',
  'Industry Leader',
  'Content Creator',
  'Educational',
  'Other'
]

// Computed
const activeCompetitors = computed(() => 
  props.competitors.filter(c => c.isActive)
)

// Methods
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'recently'
}

const addCompetitor = async () => {
  if (!newCompetitor.value.username) return
  
  addingCompetitor.value = true
  
  try {
    await $fetch('/api/admin/twitter/competitors', {
      method: 'POST',
      body: {
        username: newCompetitor.value.username.replace('@', ''),
        category: newCompetitor.value.category
      }
    })
    
    emit('competitor-added', newCompetitor.value.username, newCompetitor.value.category)
    
    // Reset form
    newCompetitor.value = { username: '', category: '' }
    
    useNuxtApp().$toast?.success('Competitor added successfully')
  } catch (error: any) {
    useNuxtApp().$toast?.error(error.data?.message || 'Failed to add competitor')
  } finally {
    addingCompetitor.value = false
  }
}

const toggleCompetitor = async (competitor: Competitor) => {
  try {
    await $fetch(`/api/admin/twitter/competitors/${competitor.id}`, {
      method: 'PATCH',
      body: {
        isActive: competitor.isActive
      }
    })
    
    emit('competitor-updated', competitor)
  } catch (error: any) {
    // Revert on error
    competitor.isActive = !competitor.isActive
    useNuxtApp().$toast?.error('Failed to update competitor')
  }
}

const analyzeCompetitor = async (competitor: Competitor) => {
  competitor.isAnalyzing = true
  emit('analysis-started', competitor.id)
  
  try {
    const { data } = await $fetch('/api/admin/twitter/analyze', {
      method: 'POST',
      body: {
        competitorIds: [competitor.id],
        includeRecommendations: true
      }
    })
    
    emit('analysis-completed', data)
    
    useNuxtApp().$toast?.success(`Analysis complete for ${competitor.username}`)
  } catch (error: any) {
    useNuxtApp().$toast?.error(error.data?.message || 'Analysis failed')
  } finally {
    competitor.isAnalyzing = false
  }
}

const removeCompetitor = async (competitor: Competitor) => {
  if (!confirm(`Remove ${competitor.username} from competitors?`)) return
  
  try {
    await $fetch(`/api/admin/twitter/competitors/${competitor.id}`, {
      method: 'DELETE'
    })
    
    emit('competitor-updated', competitor)
    
    useNuxtApp().$toast?.success('Competitor removed')
  } catch (error: any) {
    useNuxtApp().$toast?.error('Failed to remove competitor')
  }
}
</script>