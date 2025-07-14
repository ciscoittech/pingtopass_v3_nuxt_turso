<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth'
})

// Breadcrumb
const page = ref({ title: 'Profile' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Profile',
    disabled: true,
    to: ''
  }
])

// Get user data
const { data: userData } = await useFetch('/api/auth/me')
const user = userData.value?.user

// Get user progress
const { data: progressData } = await useFetch('/api/progress')
const progress = computed(() => progressData.value?.data)

// Get analytics
const { data: analyticsData } = await useFetch('/api/progress/analytics', {
  query: { period: 'all' }
})
const analytics = computed(() => analyticsData.value?.data)
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Profile Header -->
    <UiParentCard class="mb-6">
      <div class="d-flex align-center flex-wrap">
        <v-avatar size="80" color="primary" variant="tonal" class="mr-4">
          <span class="text-h4">{{ user?.name?.charAt(0) || 'U' }}</span>
        </v-avatar>
        
        <div class="flex-grow-1">
          <h2 class="text-h4 mb-1">{{ user?.name || 'User' }}</h2>
          <p class="text-body-1 text-grey100 mb-0">{{ user?.email }}</p>
          <v-chip color="success" variant="tonal" size="small" class="mt-2">
            <Icon icon="solar:verified-check-bold" size="16" class="mr-1" />
            Active Account
          </v-chip>
        </div>

        <v-btn color="primary" variant="tonal" to="/settings">
          <Icon icon="solar:settings-linear" class="mr-2" />
          Edit Profile
        </v-btn>
      </div>
    </UiParentCard>

    <v-row>
      <!-- Stats Overview -->
      <v-col cols="12" lg="4">
        <UiParentCard title="Study Statistics">
          <v-list>
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:book-2-linear" />
                </v-avatar>
              </template>
              <v-list-item-title>Total Study Time</v-list-item-title>
              <v-list-item-subtitle>{{ Math.round((progress?.overall?.totalStudyTime || 0) / 60) }} minutes</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="success" variant="tonal">
                  <Icon icon="solar:verified-check-linear" />
                </v-avatar>
              </template>
              <v-list-item-title>Questions Answered</v-list-item-title>
              <v-list-item-subtitle>{{ analytics?.overall?.totalAnswered || 0 }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="warning" variant="tonal">
                  <Icon icon="solar:fire-linear" />
                </v-avatar>
              </template>
              <v-list-item-title>Current Streak</v-list-item-title>
              <v-list-item-subtitle>{{ progress?.streaks?.currentDaily || 0 }} days</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="info" variant="tonal">
                  <Icon icon="solar:chart-linear" />
                </v-avatar>
              </template>
              <v-list-item-title>Average Accuracy</v-list-item-title>
              <v-list-item-subtitle>{{ Math.round(progress?.overall?.averageAccuracy || 0) }}%</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>
      </v-col>

      <!-- Recent Activity -->
      <v-col cols="12" lg="8">
        <UiParentCard title="Recent Activity">
          <div v-if="analytics?.recentActivities?.length > 0">
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="activity in analytics.recentActivities.slice(0, 5)"
                :key="activity.id"
                dot-color="primary"
                size="x-small"
              >
                <div class="d-flex justify-space-between align-center mb-2">
                  <h6 class="text-h6">{{ activity.examName }}</h6>
                  <v-chip size="small" variant="tonal">
                    {{ new Date(activity.createdAt * 1000).toLocaleDateString() }}
                  </v-chip>
                </div>
                <p class="text-body-2 text-grey100">
                  Answered {{ activity.questionsAnswered }} questions
                  <v-chip size="x-small" :color="activity.correctAnswers > activity.incorrectAnswers ? 'success' : 'error'" variant="tonal" class="ml-2">
                    {{ Math.round((activity.correctAnswers / activity.questionsAnswered) * 100) }}% accuracy
                  </v-chip>
                </p>
              </v-timeline-item>
            </v-timeline>
          </div>
          <div v-else class="text-center py-8">
            <Icon icon="solar:document-text-broken" size="48" class="mb-4 text-grey-lighten-1" />
            <p class="text-body-1 text-grey100">No recent activity</p>
            <v-btn color="primary" variant="tonal" to="/exams" class="mt-4">
              Start Studying
            </v-btn>
          </div>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>