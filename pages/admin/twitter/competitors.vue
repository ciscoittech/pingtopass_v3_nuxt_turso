<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Competitor Analysis</h1>
            <p class="text-subtitle-1 text-grey">
              Track and analyze competitor Twitter strategies
            </p>
          </div>
          <v-btn color="primary" @click="showAddDialog = true">
            <v-icon start>mdi-plus</v-icon>
            Add Competitor
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Competitors Grid -->
    <v-row>
      <v-col
        v-for="competitor in competitors"
        :key="competitor.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card elevation="10" class="h-100">
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal" size="48">
                <v-icon>mdi-twitter</v-icon>
              </v-avatar>
            </template>
            <v-card-title>{{ competitor.username }}</v-card-title>
            <v-card-subtitle>{{ competitor.name }}</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-account-group</v-icon>
                  {{ formatNumber(competitor.followers) }} followers
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-twitter</v-icon>
                  {{ formatNumber(competitor.tweets) }} tweets
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
                  Added {{ formatDate(competitor.createdAt) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              @click="analyzeCompetitor(competitor)"
            >
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

    <!-- Add Competitor Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title>Add Competitor</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newCompetitor.username"
            label="Twitter Username"
            placeholder="@username"
            variant="outlined"
            prepend-inner-icon="mdi-at"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addCompetitor">Add</v-btn>
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
const page = ref({ title: 'Competitor Analysis' })
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
    text: 'Competitors',
    disabled: true,
    to: ''
  }
])

// Data
const showAddDialog = ref(false)
const newCompetitor = ref({ username: '' })
const competitors = ref([
  {
    id: '1',
    username: '@CompTIA',
    name: 'CompTIA',
    followers: 125000,
    tweets: 8500,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    username: '@CiscoNetAcad',
    name: 'Cisco Networking Academy',
    followers: 89000,
    tweets: 12000,
    createdAt: new Date('2024-02-01')
  }
])

// Methods
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString()
}

const addCompetitor = () => {
  // TODO: Implement add competitor
  showAddDialog.value = false
  newCompetitor.value = { username: '' }
}

const analyzeCompetitor = (competitor: any) => {
  // TODO: Implement analyze
  console.log('Analyzing', competitor)
}

const removeCompetitor = (competitor: any) => {
  // TODO: Implement remove
  console.log('Removing', competitor)
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