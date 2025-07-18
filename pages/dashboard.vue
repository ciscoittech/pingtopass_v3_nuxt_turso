<script setup lang="ts">
import { ref } from "vue";
// Theme Components from Spike
import WelcomeCard from "@/components/dashboards/pingtopass/WelcomeCard.vue";
import ContinueStudyCard from "@/components/dashboards/pingtopass/ContinueStudyCard.vue";
import StudyStreak from "@/components/dashboards/pingtopass/StudyStreak.vue";
import QuestionsAnswered from "@/components/dashboards/pingtopass/QuestionsAnswered.vue";
import StudyProgress from "@/components/dashboards/pingtopass/StudyProgress.vue";
import QuickActionsSpike from "@/components/dashboards/pingtopass/QuickActionsSpike.vue";
import StudyAnalytics from "@/components/dashboards/pingtopass/StudyAnalytics.vue";
import RecentActivity from "@/components/dashboards/pingtopass/RecentActivity.vue";
import TutorialOverlay from "@/components/tutorial/TutorialOverlay.vue";
import WelcomeMessage from "@/components/dashboards/pingtopass/WelcomeMessage.vue";
import LeaderboardPreview from "@/components/dashboards/pingtopass/LeaderboardPreview.vue";
import WeeklyAchievements from "@/components/dashboards/pingtopass/WeeklyAchievements.vue";
import SmartNotifications from "@/components/dashboards/pingtopass/SmartNotifications.vue";
import XPLevelCard from "@/components/dashboards/pingtopass/XPLevelCard.vue";
import PerformanceMessages from "@/components/dashboards/pingtopass/PerformanceMessages.vue";


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

// Get total exam count
const totalExams = computed(() => examsData.value?.data?.length || 0)

// Get today's study time
const todayStudyTime = computed(() => {
  const todayData = analytics.value?.daily?.find((day: any) => {
    const today = new Date().toDateString();
    return new Date(day.date).toDateString() === today;
  });
  return todayData?.studyTime || 0;
});

// Format time helper
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Tutorial state
const showTutorial = ref(false)

// Check if first-time user
onMounted(() => {
  const tutorialCompleted = localStorage.getItem('tutorialCompleted')
  const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
  
  // Show tutorial for first-time users or if never completed
  if (!tutorialCompleted && !hasSeenTutorial) {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
      showTutorial.value = true
    }, 1000)
  }
})

// Handle tutorial completion
const onTutorialComplete = () => {
  // You could track this event for analytics
  console.log('Tutorial completed!')
}

</script>

<template>
  <div>
    <!-- Smart Notifications -->
    <SmartNotifications />
    
    <!-- Welcome Message -->
    <WelcomeMessage :user-name="user?.name" />
    
    <v-row class="dashboard-grid">
      <!-- Row 1: Welcome and Continue Study -->
      <v-col cols="12" md="8" class="pb-3">
        <WelcomeCard 
          class="welcome-card h-100" 
          :user-name="user?.name || 'Student'"
          :total-exams="totalExams"
          :completed-exams="progress?.overall?.examsCompleted || 0"
          :study-streak="progress?.streaks?.currentDaily || 0"
          :study-hours="todayStudyTime"
        />
      </v-col>
      
      <v-col cols="12" md="4" class="pb-3">
        <ContinueStudyCard class="continue-study-card h-100" />
      </v-col>
      
      <!-- Row 2: Stats Cards -->
      <v-col cols="6" sm="3" class="pb-3">
        <StudyStreak 
          class="h-100"
          :streak="progress?.streaks?.currentDaily || 0"
          :weekly-data="[1, 1, 1, 0, 1, 1, 1]"
        />
      </v-col>
      
      <v-col cols="6" sm="3" class="pb-3">
        <QuestionsAnswered 
          class="h-100"
          :total-questions="analytics?.overall?.totalAnswered || 0"
          :accuracy="Math.round(progress?.overall?.averageAccuracy || 0)"
        />
      </v-col>
      
      <v-col cols="12" sm="6" class="pb-3">
        <QuickActionsSpike :exams="exams" class="quick-actions-card h-100" />
      </v-col>
      
      <!-- Row 3: Study Progress (full width) -->
      <v-col cols="12" class="pb-3">
        <StudyProgress 
          :study-time="progress?.overall?.totalStudyTime || 0"
          :weekly-progress="[30, 45, 50, 35, 40, 55, 60]"
        />
      </v-col>
      
      <!-- Row 4: Gamification Cards -->
      <v-col cols="12" md="4" class="pb-3">
        <LeaderboardPreview class="h-100" />
      </v-col>
      
      <v-col cols="12" md="4" class="pb-3">
        <WeeklyAchievements class="h-100" />
      </v-col>
      
      <v-col cols="12" md="4" class="pb-3">
        <XPLevelCard class="h-100" />
      </v-col>
      
      <!-- Row 5: Performance Messages -->
      <v-col cols="12" class="pb-3">
        <PerformanceMessages />
      </v-col>
      
      <!-- Row 6: Analytics (desktop only) -->
      <v-col v-if="!$vuetify.display.smAndDown" cols="12" class="pb-3">
        <StudyAnalytics />
      </v-col>
    </v-row>
    
    <!-- Tutorial Overlay -->
    <TutorialOverlay 
      v-model="showTutorial"
      @complete="onTutorialComplete"
    />
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/dashboard-layout.scss';
</style>