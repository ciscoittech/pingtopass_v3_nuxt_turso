<template>
  <v-container fluid>
    <!-- Page Header -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="0" class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4">AI Model Settings</h1>
              <p class="text-body-1 text-medium-emphasis mt-2">
                Configure AI models for different features. Choose cost-effective models based on your needs.
              </p>
            </div>
            <v-chip color="primary" variant="tonal" size="small">
              <v-icon start size="small">mdi-cog</v-icon>
              Admin Only
            </v-chip>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Model Settings -->
    <v-row>

      <v-col v-for="feature in features" :key="feature.id" cols="12" lg="6">
              <v-card elevation="0" border>
                <v-card-item>
                  <template v-slot:prepend>
                    <v-avatar :color="getFeatureColor(feature.id)" variant="tonal">
                      <v-icon>{{ feature.icon }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-card-title>{{ feature.name }}</v-card-title>
                  <v-card-subtitle>{{ feature.description }}</v-card-subtitle>
                </v-card-item>
                
                <v-card-text>
                  <!-- Current Model -->
                  <div v-if="currentSettings[feature.id]" class="mb-4">
                    <div class="text-overline mb-2">Current Model</div>
                    <v-card variant="tonal" :color="getFeatureColor(feature.id)" density="compact">
                      <v-card-text class="pa-3">
                        <div class="d-flex align-center justify-space-between">
                          <div>
                            <div class="font-weight-medium">{{ currentSettings[feature.id].modelName }}</div>
                            <div class="text-caption text-medium-emphasis">
                              <v-icon size="x-small">mdi-currency-usd</v-icon>
                              ${{ currentSettings[feature.id].costPerMillion.toFixed(2) }} / 1M tokens
                            </div>
                          </div>
                          <v-chip size="small" variant="elevated">
                            {{ currentSettings[feature.id].provider }}
                          </v-chip>
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>

                  <!-- Model Selection -->
                  <div class="text-overline mb-2">Select New Model</div>
                  <v-select
                    v-model="selectedModels[feature.id]"
                    :items="getFilteredModels(feature)"
                    item-title="displayName"
                    item-value="id"
                    placeholder="Choose a model"
                    variant="outlined"
                    density="compact"
                    :loading="isLoading"
                    hide-details
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" density="comfortable">
                        <template v-slot:prepend>
                          <v-avatar size="36" :color="getProviderColor(item.raw.provider)" variant="tonal">
                            <span class="text-caption font-weight-bold">
                              {{ item.raw.provider.substring(0, 2).toUpperCase() }}
                            </span>
                          </v-avatar>
                        </template>
                        <v-list-item-subtitle>
                          <div class="d-flex align-center gap-2 mt-1">
                            <v-chip size="x-small" :color="getSpeedColor(item.raw.speed)" variant="tonal">
                              <v-icon start size="x-small">mdi-speedometer</v-icon>
                              {{ item.raw.speed }}
                            </v-chip>
                            <v-chip size="x-small" :color="getQualityColor(item.raw.quality)" variant="tonal">
                              <v-icon start size="x-small">mdi-star</v-icon>
                              {{ item.raw.quality }}
                            </v-chip>
                            <span class="text-caption font-weight-medium">
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
                    variant="tonal"
                    class="mt-3"
                  >
                    <v-icon size="small">mdi-alert</v-icon>
                    This feature requires tool calling support
                  </v-alert>

                  <!-- Update Button -->
                  <v-btn
                    :color="getFeatureColor(feature.id)"
                    :loading="isUpdating[feature.id]"
                    :disabled="!selectedModels[feature.id] || selectedModels[feature.id] === currentSettings[feature.id]?.modelId"
                    @click="updateModelSetting(feature.id)"
                    block
                    class="mt-4"
                    variant="elevated"
                  >
                    Update Model
                  </v-btn>
                </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Cost Summary -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="0" border>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Cost Summary</span>
            <v-chip color="success" variant="tonal" size="small">
              <v-icon start size="small">mdi-currency-usd</v-icon>
              Monthly Estimate
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <v-table density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Feature</th>
                <th class="text-left">Model</th>
                <th class="text-right">Cost per 1M tokens</th>
                <th class="text-right">Est. Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="feature in features" :key="feature.id">
                <td>
                  <div class="d-flex align-center">
                    <v-icon size="small" :color="getFeatureColor(feature.id)" class="mr-2">
                      {{ feature.icon }}
                    </v-icon>
                    {{ feature.name }}
                  </div>
                </td>
                <td>
                  <v-chip size="small" variant="tonal" v-if="currentSettings[feature.id]">
                    {{ currentSettings[feature.id].modelName }}
                  </v-chip>
                  <span v-else class="text-medium-emphasis">Not configured</span>
                </td>
                <td class="text-right">
                  <span v-if="currentSettings[feature.id]" class="font-weight-medium">
                    ${{ currentSettings[feature.id].costPerMillion.toFixed(2) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="text-right">
                  <span class="font-weight-medium">
                    ${{ estimateMonthlyCost(feature.id).toFixed(2) }}
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">
                  <span class="text-h6">Total Estimated Monthly Cost</span>
                </td>
                <td class="text-right">
                  <v-chip color="primary" variant="elevated" size="large">
                    ${{ totalMonthlyCost.toFixed(2) }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
          
            <v-alert type="info" variant="tonal" class="mt-4">
              <v-icon size="small">mdi-information</v-icon>
              Estimates based on expected usage patterns. Actual costs may vary.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Page metadata
definePageMeta({
  title: 'AI Model Settings',
  requiresAuth: true,
  adminOnly: true
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
    return total + estimateMonthlyCost(feature.id)
  }, 0)
})

// Helper functions
const getFeatureColor = (featureId: string) => {
  switch (featureId) {
    case 'chat_user': return 'primary'
    case 'chat_admin': return 'secondary'
    case 'question_generation': return 'success'
    case 'twitter_analysis': return 'info'
    default: return 'grey'
  }
}

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'openai': return 'green'
    case 'anthropic': return 'purple'
    case 'google': return 'blue'
    case 'meta': return 'indigo'
    case 'deepseek': return 'orange'
    case 'mistral': return 'red'
    default: return 'grey'
  }
}

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
    const response = await $fetch('/api/admin/models/index')
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

