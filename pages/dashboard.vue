<script setup lang="ts">
import { ref } from "vue";
// Theme Components
import WelcomeCard from "@/components/dashboards/dashboard2/WelcomeCard.vue";
import StatsCards from "@/components/dashboards/pingtopass/StatsCards.vue";
import ProfitExpanse from "@/components/dashboards/dashboard2/ProfitExpanse.vue";
import ProductSales from "@/components/dashboards/dashboard2/ProductSales.vue";
import TrafficDistribution from "@/components/dashboards/dashboard2/TrafficDistribution.vue";
import UpcommingSchedule from "@/components/dashboards/dashboard2/UpcommingSchedule.vue";
import CongratsCard from "@/components/dashboards/dashboard1/CongratulationsCard.vue";
import LatestReviews from "@/components/dashboards/dashboard1/LatestReviews.vue";

// Require authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Get user data
const { data: userData } = await useFetch('/api/auth/me');
const user = userData.value?.user;

// Get user progress data
const { data: progressData, pending: progressLoading, error: progressError } = await useFetch('/api/progress', {
  server: false // Client-side only to handle auth properly
})
const progress = computed(() => progressData.value?.data)

// Get analytics data
const { data: analyticsData, pending: analyticsLoading, error: analyticsError } = await useFetch('/api/progress/analytics', {
  query: { period: 'month' },
  server: false
})
const analytics = computed(() => analyticsData.value?.data)

// Get recent exams
const { data: examsData } = await useFetch('/api/exams', {
  query: { limit: 5 }
})
const exams = computed(() => examsData.value?.data || [])

// Stats for cards
const stats = computed(() => ({
  studyStreak: progress.value?.streaks?.currentDaily || 0,
  totalStudyTime: progress.value?.overall?.totalStudyTime || 0,
  averageAccuracy: progress.value?.overall?.averageAccuracy || 0,
  questionsAnswered: analytics.value?.overall?.totalAnswered || 0
}))
</script>

<template>
  <v-row>
    <!-- Welcome Card -->
    <v-col cols="12" sm="12" lg="8">
      <CongratsCard />
    </v-col>

    <!-- Quick Actions -->
    <v-col cols="12" sm="12" lg="4">
      <v-card elevation="10" class="h-100">
        <v-card-text>
          <h5 class="text-h5 mb-4">Quick Actions</h5>
          <v-list>
            <v-list-item 
              v-for="exam in exams.slice(0, 3)" 
              :key="exam.id"
              :to="`/study/${exam.id}`"
              class="px-0 mb-2"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="mdi-book-open-variant" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ exam.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ exam.code }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-btn color="primary" variant="flat" block class="mt-4" to="/exams">
            Browse All Exams
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Stats Cards -->
    <v-col cols="12">
      <div v-if="progressLoading || analyticsLoading" class="d-flex justify-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <StatsCards v-else :stats="stats" />
    </v-col>

    <!-- Study Progress Chart -->
    <v-col cols="12" sm="12" lg="8">
      <v-card elevation="10">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <h5 class="text-h5 font-weight-semibold">Study Progress</h5>
              <p class="text-subtitle-1 text-grey100">Your learning journey</p>
            </div>
            <v-chip color="success" variant="tonal">
              {{ progress?.weeklyProgress?.percentage || 0 }}% of weekly goal
            </v-chip>
          </div>
          
          <!-- Placeholder for chart - can add apexcharts later -->
          <div class="py-10 text-center">
            <v-icon icon="mdi-chart-line" size="48" color="primary" />
            <p class="text-subtitle-1 text-grey100 mt-2">Progress chart coming soon</p>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Recent Activity -->
    <v-col cols="12" sm="12" lg="4">
      <UpcommingSchedule />
    </v-col>

    <!-- Study Tips -->
    <v-col cols="12">
      <v-card elevation="10">
        <v-card-text>
          <h5 class="text-h5 mb-4">Study Tips</h5>
          <v-row>
            <v-col cols="12" md="4">
              <div class="d-flex align-start">
                <v-avatar color="primary" variant="tonal" class="mr-3">
                  <v-icon icon="mdi-lightbulb-outline" />
                </v-avatar>
                <div>
                  <h6 class="text-h6 mb-1">Stay Consistent</h6>
                  <p class="text-body-2 text-grey100">Study a little bit every day to maintain your streak and improve retention.</p>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="d-flex align-start">
                <v-avatar color="success" variant="tonal" class="mr-3">
                  <v-icon icon="mdi-target" />
                </v-avatar>
                <div>
                  <h6 class="text-h6 mb-1">Focus on Weak Areas</h6>
                  <p class="text-body-2 text-grey100">Review questions you got wrong to strengthen your understanding.</p>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="d-flex align-start">
                <v-avatar color="info" variant="tonal" class="mr-3">
                  <v-icon icon="mdi-clock-outline" />
                </v-avatar>
                <div>
                  <h6 class="text-h6 mb-1">Take Practice Tests</h6>
                  <p class="text-body-2 text-grey100">Simulate real exam conditions to build confidence and time management.</p>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>