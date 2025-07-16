<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Twitter Analytics Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Competitors Tracked</p>
                <h4 class="text-h4 font-weight-bold">{{ stats.competitorsCount }}</h4>
              </div>
              <v-avatar color="primary" variant="tonal" size="48">
                <Icon icon="solar:users-group-two-rounded-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Tweets Analyzed</p>
                <h4 class="text-h4 font-weight-bold">{{ stats.tweetsAnalyzed }}</h4>
              </div>
              <v-avatar color="success" variant="tonal" size="48">
                <Icon icon="solar:chat-square-like-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Content Ideas</p>
                <h4 class="text-h4 font-weight-bold">{{ stats.contentIdeas }}</h4>
              </div>
              <v-avatar color="info" variant="tonal" size="48">
                <Icon icon="solar:lightbulb-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Active Alerts</p>
                <h4 class="text-h4 font-weight-bold">{{ stats.activeAlerts }}</h4>
              </div>
              <v-avatar color="warning" variant="tonal" size="48">
                <Icon icon="solar:bell-bing-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Analysis & Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <UiParentCard title="Recent Analyses">
          <v-list v-if="recentAnalyses.length > 0" lines="two" class="pa-0">
            <v-list-item
              v-for="(analysis, index) in recentAnalyses"
              :key="index"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar :color="getAnalysisColor(analysis.type)" variant="tonal">
                  <Icon icon="solar:chart-square-linear" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ analysis.competitorName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ analysis.insightsCount }} insights • {{ formatRelativeTime(analysis.timestamp) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn icon="mdi-chevron-right" variant="text" size="small" />
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8">
            <Icon icon="solar:chart-broken" size="48" class="mb-2 text-grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis">No analyses yet</p>
          </div>
        </UiParentCard>
      </v-col>
      <v-col cols="12" md="4">
        <UiParentCard title="Quick Actions">
          <v-list class="pa-0">
            <v-list-item @click="navigateTo('/admin/twitter/competitors')" class="px-0 mb-2">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:add-circle-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Add Competitor</v-list-item-title>
              <v-list-item-subtitle>Track new accounts</v-list-item-subtitle>
            </v-list-item>
            <v-list-item @click="runAnalysis" class="px-0 mb-2">
              <template v-slot:prepend>
                <v-avatar color="success" variant="tonal">
                  <Icon icon="solar:play-circle-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Run Analysis</v-list-item-title>
              <v-list-item-subtitle>Analyze all competitors</v-list-item-subtitle>
            </v-list-item>
            <v-list-item @click="navigateTo('/admin/twitter/content')" class="px-0">
              <template v-slot:prepend>
                <v-avatar color="info" variant="tonal">
                  <Icon icon="solar:document-text-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Content Strategy</v-list-item-title>
              <v-list-item-subtitle>View recommendations</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Engagement Trends Chart -->
    <UiParentCard title="Engagement Trends">
      <div class="text-center py-12">
        <Icon icon="solar:chart-line-broken" size="64" class="mb-4 text-grey-lighten-1" />
        <h5 class="text-h5 mb-2">Coming Soon</h5>
        <p class="text-body-1 text-grey100">
          Engagement trends visualization will be available soon
        </p>
      </div>
    </UiParentCard>
  </div>
</template>

<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Twitter Analytics Dashboard' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Twitter Intelligence',
    disabled: true,
    to: ''
  }
])

// Mock data for now
const stats = ref({
  competitorsCount: 12,
  tweetsAnalyzed: 2453,
  contentIdeas: 47,
  activeAlerts: 3
})

const recentAnalyses = ref([
  {
    competitorName: '@CompTIA',
    type: 'competitor',
    insightsCount: 15,
    timestamp: Date.now() / 1000 - 3600
  },
  {
    competitorName: '@CiscoNetAcad',
    type: 'competitor',
    insightsCount: 12,
    timestamp: Date.now() / 1000 - 7200
  },
  {
    competitorName: '@Microsoft',
    type: 'competitor',
    insightsCount: 18,
    timestamp: Date.now() / 1000 - 10800
  }
])

// Helper functions
const formatRelativeTime = (timestamp: number) => {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  const hours = Math.floor(diff / 3600)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

const getAnalysisColor = (type: string) => {
  switch (type) {
    case 'competitor': return 'primary'
    case 'content': return 'success'
    case 'trend': return 'info'
    default: return 'grey'
  }
}

const runAnalysis = () => {
  // TODO: Implement analysis run
  console.log('Running analysis...')
}
</script>