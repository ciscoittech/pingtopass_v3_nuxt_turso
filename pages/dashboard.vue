<script setup lang="ts">
import { ref } from "vue";
// Theme Components from Spike
import CongratsCard from "@/components/dashboards/dashboard1/CongratulationsCard.vue";
import StudyStreak from "@/components/dashboards/pingtopass/StudyStreak.vue";
import QuestionsAnswered from "@/components/dashboards/pingtopass/QuestionsAnswered.vue";
import StudyProgress from "@/components/dashboards/pingtopass/StudyProgress.vue";
import QuickActionsSpike from "@/components/dashboards/pingtopass/QuickActionsSpike.vue";
import ProfitExpanse from "@/components/dashboards/dashboard2/ProfitExpanse.vue";
import UpcommingSchedule from "@/components/dashboards/dashboard2/UpcommingSchedule.vue";


// Require authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Get user data
const { data: userData } = await useFetch('/api/auth/me');
const user = computed(() => userData.value?.user);

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

// Format time helper
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

</script>

<template>
  <v-row>
    <!-- Congratulation Card -->
    <v-col cols="12" sm="12" lg="6">
      <CongratsCard />
    </v-col>
    <v-col cols="12" sm="12" md="12" lg="6">
      <v-row>
        <!-- Study Streak Card  -->
        <v-col cols="12" sm="6">
          <StudyStreak 
            :streak="progress?.streaks?.currentDaily || 0"
            :weekly-data="[1, 1, 1, 0, 1, 1, 1]"
          />
        </v-col>
        <!-- Questions Card -->
        <v-col cols="12" sm="6" class="d-flex">
          <QuestionsAnswered 
            :total-questions="analytics?.overall?.totalAnswered || 0"
            :accuracy="Math.round(progress?.overall?.averageAccuracy || 0)"
          />
        </v-col>
        <!-- Quick Actions Card -->
        <v-col cols="12" sm="6">
          <QuickActionsSpike :exams="exams" />
        </v-col>
        <!-- Study Progress Card -->
        <v-col cols="12" sm="6" class="d-flex">
          <StudyProgress 
            :study-time="progress?.overall?.totalStudyTime || 0"
            :weekly-progress="[30, 45, 50, 35, 40, 55, 60]"
          />
        </v-col>
      </v-row>
    </v-col>
    <!-- Study Chart  -->
    <v-col cols="12" sm="12" lg="8">
      <ProfitExpanse />
    </v-col>
    <!-- Recent Activity  -->
    <v-col cols="12" sm="12" lg="4">
      <UpcommingSchedule />
    </v-col>
  </v-row>
</template>