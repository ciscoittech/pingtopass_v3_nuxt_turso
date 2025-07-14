<template>
  <NuxtLayout>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">AI Model Settings</h1>
          <p class="text-subtitle-1 text-grey mb-6">
            Configure AI models for different features. Admin sets the models that users will use.
          </p>
        </v-col>
      </v-row>

      <!-- Model Settings Cards -->
      <v-row>
        <v-col v-for="feature in features" :key="feature.id" cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">{{ feature.icon }}</v-icon>
              {{ feature.name }}
            </v-card-title>
            <v-card-subtitle>
              {{ feature.description }}
            </v-card-subtitle>
            
            <v-card-text>
              <!-- Current Model -->
              <div v-if="currentSettings[feature.id]" class="mb-4">
                <p class="text-caption text-grey mb-1">Current Model</p>
                <v-chip color="primary" class="mb-2">
                  {{ currentSettings[feature.id].modelName }}
                </v-chip>
                <div class="d-flex align-center text-caption">
                  <v-icon size="small" class="mr-1">mdi-currency-usd</v-icon>
                  ${{ currentSettings[feature.id].costPerMillion.toFixed(2) }} / 1M tokens
                  <v-chip size="x-small" class="ml-2">
                    {{ currentSettings[feature.id].provider }}
                  </v-chip>
                </div>
              </div>

              <!-- Model Selection -->
              <v-select
                v-model="selectedModels[feature.id]"
                :items="getFilteredModels(feature)"
                item-title="displayName"
                item-value="id"
                label="Select Model"
                variant="outlined"
                density="compact"
                :loading="isLoading"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-avatar size="32" color="grey-lighten-3">
                        <span class="text-caption">{{ item.raw.provider.substring(0, 2).toUpperCase() }}</span>
                      </v-avatar>
                    </template>
                    <v-list-item-subtitle>
                      <div class="d-flex align-center">
                        <v-chip size="x-small" :color="getSpeedColor(item.raw.speed)" class="mr-2">
                          {{ item.raw.speed }}
                        </v-chip>
                        <v-chip size="x-small" :color="getQualityColor(item.raw.quality)" class="mr-2">
                          {{ item.raw.quality }}
                        </v-chip>
                        <span class="text-caption">
                          ${{ item.raw.averageCost.toFixed(2) }}/1M
                        </span>
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>

              <!-- Capabilities Warning -->
              <v-alert
                v-if="feature.requiresToolCalling && selectedModels[feature.id] && !getModelCapabilities(selectedModels[feature.id])?.toolCalling"
                type="warning"
                density="compact"
                class="mt-2"
              >
                This feature requires tool calling support
              </v-alert>

              <!-- Update Button -->
              <v-btn
                color="primary"
                :loading="isUpdating[feature.id]"
                :disabled="!selectedModels[feature.id] || selectedModels[feature.id] === currentSettings[feature.id]?.modelId"
                @click="updateModelSetting(feature.id)"
                block
                class="mt-2"
              >
                Update Model
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Cost Summary -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-currency-usd</v-icon>
              Cost Summary
            </v-card-title>
            <v-card-text>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Model</th>
                      <th>Avg Cost per 1M tokens</th>
                      <th>Est. Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="feature in features" :key="feature.id">
                      <td>{{ feature.name }}</td>
                      <td>
                        {{ currentSettings[feature.id]?.modelName || 'Not set' }}
                      </td>
                      <td>
                        ${{ currentSettings[feature.id]?.costPerMillion.toFixed(2) || '0.00' }}
                      </td>
                      <td>
                        ${{ estimateMonthlyCost(feature.id).toFixed(2) }}
                      </td>
                    </tr>
                    <tr class="font-weight-bold">
                      <td colspan="3">Total Estimated Monthly Cost</td>
                      <td>${{ totalMonthlyCost.toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Page metadata
definePageMeta({
  title: 'AI Model Settings',
  requiresAuth: true,
  layout: 'admin'
})

// Types
interface Feature {
  id: string
  name: string
  description: string
  icon: string
  requiresToolCalling: boolean
  estimatedTokensPerMonth: number
}

// Features configuration
const features: Feature[] = [
  {
    id: 'chat_user',
    name: 'User Chat',
    description: 'Chat assistant for users studying for exams',
    icon: 'mdi-chat',
    requiresToolCalling: false,
    estimatedTokensPerMonth: 5_000_000 // 5M tokens/month estimate
  },
  {
    id: 'chat_admin',
    name: 'Admin Chat',
    description: 'Admin chat with access to system tools and analytics',
    icon: 'mdi-shield-account',
    requiresToolCalling: true,
    estimatedTokensPerMonth: 500_000 // 500K tokens/month
  },
  {
    id: 'question_generation',
    name: 'Question Generation',
    description: 'AI-powered question generation for exams',
    icon: 'mdi-brain',
    requiresToolCalling: false,
    estimatedTokensPerMonth: 2_000_000 // 2M tokens/month
  },
  {
    id: 'twitter_analysis',
    name: 'Twitter Analysis',
    description: 'Competitor and content analysis for Twitter',
    icon: 'mdi-twitter',
    requiresToolCalling: false,
    estimatedTokensPerMonth: 1_000_000 // 1M tokens/month
  }
]

// Reactive data
const currentSettings = ref<Record<string, any>>({})
const availableModels = ref<any[]>([])
const selectedModels = ref<Record<string, string>>({})
const isLoading = ref(false)
const isUpdating = ref<Record<string, boolean>>({})

// Computed
const totalMonthlyCost = computed(() => {
  return features.reduce((total, feature) => {
    return total + estimateMonthlyC

ost(feature.id)
  }, 0)
})

// Helper functions
const getSpeedColor = (speed: string) => {
  switch (speed) {
    case 'fast': return 'success'
    case 'medium': return 'warning'
    case 'slow': return 'error'
    default: return 'grey'
  }
}

const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'excellent': return 'success'
    case 'good': return 'primary'
    case 'fair': return 'warning'
    default: return 'grey'
  }
}

const getFilteredModels = (feature: Feature) => {
  return availableModels.value
    .filter(model => {
      // Filter by tool calling requirement
      if (feature.requiresToolCalling && !model.capabilities.toolCalling) {
        return false
      }
      return true
    })
    .map(model => ({
      ...model,
      displayName: `${model.name} (${model.provider})`
    }))
    .sort((a, b) => a.averageCost - b.averageCost)
}

const getModelCapabilities = (modelId: string) => {
  const model = availableModels.value.find(m => m.id === modelId)
  return model?.capabilities
}

const estimateMonthlyCost = (featureId: string) => {
  const feature = features.find(f => f.id === featureId)
  const setting = currentSettings.value[featureId]
  
  if (!feature || !setting) return 0
  
  const tokensPerMonth = feature.estimatedTokensPerMonth
  const costPerMillion = setting.costPerMillion
  
  return (tokensPerMonth / 1_000_000) * costPerMillion
}

// Fetch current settings and available models
const fetchSettings = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/admin/models')
    currentSettings.value = response.currentSettings || {}
    availableModels.value = response.availableModels || []
    
    // Initialize selected models with current settings
    features.forEach(feature => {
      if (currentSettings.value[feature.id]) {
        selectedModels.value[feature.id] = currentSettings.value[feature.id].modelId
      }
    })
  } catch (error) {
    console.error('Failed to fetch model settings:', error)
  } finally {
    isLoading.value = false
  }
}

// Update model setting
const updateModelSetting = async (featureId: string) => {
  const modelId = selectedModels.value[featureId]
  if (!modelId) return
  
  isUpdating.value[featureId] = true
  try {
    const response = await $fetch('/api/admin/models/update', {
      method: 'POST',
      body: {
        feature: featureId,
        modelId
      }
    })
    
    // Update current settings
    currentSettings.value[featureId] = response.setting
    
    // Show success message
    useNuxtApp().$toast?.success(`Model updated for ${features.find(f => f.id === featureId)?.name}`)
  } catch (error: any) {
    console.error('Failed to update model:', error)
    useNuxtApp().$toast?.error(error.data?.statusMessage || 'Failed to update model')
  } finally {
    isUpdating.value[featureId] = false
  }
}

// Initialize
onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.v-simple-table {
  margin-top: 16px;
}
</style>