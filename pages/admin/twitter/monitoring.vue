<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Monitoring & Alerts</h1>
            <p class="text-subtitle-1 text-grey">
              Real-time monitoring of competitor activities and trends
            </p>
          </div>
          <v-btn color="primary" @click="showAlertDialog = true">
            <v-icon start>mdi-bell-plus</v-icon>
            Create Alert
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Active Alerts -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-title>
            <v-icon class="mr-2">mdi-bell</v-icon>
            Active Alerts
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="alert in activeAlerts"
                :key="alert.id"
                class="border rounded-lg mb-2"
              >
                <template v-slot:prepend>
                  <v-icon :color="getAlertColor(alert.type)">
                    {{ getAlertIcon(alert.type) }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ alert.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ alert.description }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-switch
                    v-model="alert.enabled"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activities -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card elevation="10" class="h-100">
          <v-card-title>
            <v-icon class="mr-2">mdi-history</v-icon>
            Recent Activities
          </v-card-title>
          <v-card-text>
            <v-timeline side="end" density="compact">
              <v-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :dot-color="getActivityColor(activity.type)"
                size="small"
              >
                <template v-slot:opposite>
                  <span class="text-caption">{{ formatTime(activity.timestamp) }}</span>
                </template>
                <div>
                  <strong>{{ activity.competitor }}</strong>
                  <div class="text-body-2">{{ activity.action }}</div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Alert Statistics -->
      <v-col cols="12" md="6">
        <v-card elevation="10" class="h-100">
          <v-card-title>
            <v-icon class="mr-2">mdi-chart-bar</v-icon>
            Alert Statistics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-primary">{{ stats.totalAlerts }}</div>
                  <div class="text-body-2 text-grey">Total Alerts</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-success">{{ stats.triggeredToday }}</div>
                  <div class="text-body-2 text-grey">Triggered Today</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-warning">{{ stats.activeAlerts }}</div>
                  <div class="text-body-2 text-grey">Active Alerts</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-info">{{ stats.competitors }}</div>
                  <div class="text-body-2 text-grey">Monitored Accounts</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Alert Dialog -->
    <v-dialog v-model="showAlertDialog" max-width="600">
      <v-card>
        <v-card-title>Create Alert</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="newAlert.name"
              label="Alert Name"
              variant="outlined"
              class="mb-4"
            />
            <v-select
              v-model="newAlert.type"
              label="Alert Type"
              :items="alertTypes"
              variant="outlined"
              class="mb-4"
            />
            <v-textarea
              v-model="newAlert.description"
              label="Description"
              variant="outlined"
              rows="3"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showAlertDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createAlert">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Monitoring & Alerts' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Twitter Intelligence',
    disabled: false,
    to: '/admin/twitter'
  },
  {
    text: 'Monitoring',
    disabled: true,
    to: ''
  }
])

// Data
const showAlertDialog = ref(false)
const newAlert = ref({
  name: '',
  type: '',
  description: ''
})

const alertTypes = [
  'New Tweet',
  'Engagement Spike',
  'Follower Milestone',
  'Trending Topic',
  'Competitor Mention'
]

const activeAlerts = ref([
  {
    id: '1',
    name: 'CompTIA Tweet Alert',
    type: 'New Tweet',
    description: 'Alert when @CompTIA posts about new certifications',
    enabled: true
  },
  {
    id: '2',
    name: 'High Engagement Detection',
    type: 'Engagement Spike',
    description: 'Alert when competitor tweets get >100 likes',
    enabled: true
  }
])

const recentActivities = ref([
  {
    id: '1',
    competitor: '@CompTIA',
    action: 'Posted about A+ exam updates',
    type: 'tweet',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: '2',
    competitor: '@CiscoNetAcad',
    action: 'Engagement spike on CCNA content',
    type: 'engagement',
    timestamp: new Date(Date.now() - 7200000)
  }
])

const stats = ref({
  totalAlerts: 12,
  triggeredToday: 5,
  activeAlerts: 8,
  competitors: 6
})

// Methods
const getAlertColor = (type: string) => {
  switch (type) {
    case 'New Tweet': return 'primary'
    case 'Engagement Spike': return 'success'
    case 'Follower Milestone': return 'warning'
    case 'Trending Topic': return 'info'
    default: return 'grey'
  }
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'New Tweet': return 'mdi-twitter'
    case 'Engagement Spike': return 'mdi-trending-up'
    case 'Follower Milestone': return 'mdi-account-multiple'
    case 'Trending Topic': return 'mdi-fire'
    default: return 'mdi-bell'
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'tweet': return 'primary'
    case 'engagement': return 'success'
    case 'follower': return 'warning'
    default: return 'grey'
  }
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(timestamp).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
}

const createAlert = () => {
  // TODO: Implement alert creation
  showAlertDialog.value = false
  newAlert.value = { name: '', type: '', description: '' }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>