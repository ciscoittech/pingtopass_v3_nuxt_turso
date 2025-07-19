<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  userName: string;
  totalExams: number;
  completedExams: number;
  studyStreak: number;
  studyHours: number;
  weeklyQuestions?: number;
  accuracyTrend?: 'up' | 'down' | 'stable';
  weeklyStudyTime?: number;
  weeklyGoal?: number;
}

const props = withDefaults(defineProps<Props>(), {
  userName: 'Student',
  totalExams: 0,
  completedExams: 0,
  studyStreak: 0,
  studyHours: 0,
  weeklyQuestions: 0,
  accuracyTrend: 'stable',
  weeklyStudyTime: 0,
  weeklyGoal: 300 // 5 hours default
});

// Compute progress percentage
const progressPercentage = computed(() => {
  if (props.totalExams === 0) return 0;
  return Math.round((props.completedExams / props.totalExams) * 100);
});

// Format study hours
const formattedHours = computed(() => {
  const hours = Math.floor(props.studyHours / 3600);
  const minutes = Math.floor((props.studyHours % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Weekly goal progress
const weeklyGoalProgress = computed(() => {
  if (props.weeklyGoal === 0) return 0;
  return Math.min(Math.round((props.weeklyStudyTime / 60 / props.weeklyGoal) * 100), 100);
});

// Format weekly time
const formattedWeeklyTime = computed(() => {
  const minutes = props.weeklyStudyTime / 60;
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
});

// Get accuracy trend icon and color
const accuracyTrendInfo = computed(() => {
  switch (props.accuracyTrend) {
    case 'up':
      return { icon: 'solar:arrow-up-bold-duotone', color: 'success' };
    case 'down':
      return { icon: 'solar:arrow-down-bold-duotone', color: 'error' };
    default:
      return { icon: 'solar:arrow-right-bold-duotone', color: 'warning' };
  }
});

// Calculate motivational message
const motivationalMessage = computed(() => {
  if (props.studyStreak >= 7) {
    return "Incredible streak! Keep it up! 🔥";
  } else if (props.studyStreak >= 3) {
    return "Great progress! You're on fire! 💪";
  } else if (props.studyStreak >= 1) {
    return "Good start! Keep studying daily! 📚";
  } else {
    return "Start your study streak today! 🚀";
  }
});
</script>

<template>
    <v-card elevation="10" class="h-100">
        <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-center mb-4">
                <div>
                    <h5 class="text-h5 font-weight-bold mb-1">
                        Welcome back, {{ userName }}!
                    </h5>
                    <p class="text-body-2 text-grey100 mb-0">
                        {{ motivationalMessage }}
                    </p>
                </div>
                <v-avatar
                    class="bg-lightprimary"
                    size="60"
                >
                    <Icon icon="solar:user-bold-duotone" size="30" class="text-primary" />
                </v-avatar>
            </div>
            
            <!-- Progress Bar -->
            <div class="mb-4">
                <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-caption text-grey100">Certification Progress</span>
                    <span class="text-caption font-weight-semibold">{{ progressPercentage }}%</span>
                </div>
                <v-progress-linear
                    :model-value="progressPercentage"
                    color="primary"
                    height="8"
                    rounded
                />
                <p class="text-caption text-grey100 mt-1">{{ completedExams }} of {{ totalExams }} exams completed</p>
            </div>
            
            <!-- Quick Stats -->
            <v-row dense>
                <v-col cols="6" sm="3" class="text-center">
                    <div class="pa-2 rounded bg-lightsuccess">
                        <Icon icon="solar:fire-bold-duotone" size="24" class="text-success mb-1" />
                        <h6 class="text-h6 font-weight-bold mb-0">{{ studyStreak }}</h6>
                        <p class="text-caption text-grey100 mb-0">Day Streak</p>
                    </div>
                </v-col>
                <v-col cols="6" sm="3" class="text-center">
                    <div class="pa-2 rounded bg-lightwarning">
                        <Icon icon="solar:question-circle-bold-duotone" size="24" class="text-warning mb-1" />
                        <h6 class="text-h6 font-weight-bold mb-0">{{ weeklyQuestions }}</h6>
                        <p class="text-caption text-grey100 mb-0">This Week</p>
                    </div>
                </v-col>
                <v-col cols="6" sm="3" class="text-center">
                    <div class="pa-2 rounded bg-lightinfo">
                        <Icon icon="solar:clock-circle-bold-duotone" size="24" class="text-info mb-1" />
                        <h6 class="text-h6 font-weight-bold mb-0">{{ formattedHours }}</h6>
                        <p class="text-caption text-grey100 mb-0">Today</p>
                    </div>
                </v-col>
                <v-col cols="6" sm="3" class="text-center">
                    <div class="pa-2 rounded" :class="`bg-light${accuracyTrendInfo.color}`">
                        <Icon :icon="accuracyTrendInfo.icon" size="24" :class="`text-${accuracyTrendInfo.color} mb-1`" />
                        <h6 class="text-h6 font-weight-bold mb-0 text-capitalize">{{ accuracyTrend }}</h6>
                        <p class="text-caption text-grey100 mb-0">Accuracy</p>
                    </div>
                </v-col>
            </v-row>
            
            <!-- Weekly Goal Progress -->
            <div class="mt-4">
                <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-caption text-grey100">Weekly Study Goal</span>
                    <span class="text-caption font-weight-semibold">{{ weeklyGoalProgress }}%</span>
                </div>
                <v-progress-linear
                    :model-value="weeklyGoalProgress"
                    :color="weeklyGoalProgress >= 100 ? 'success' : 'primary'"
                    height="6"
                    rounded
                />
                <p class="text-caption text-grey100 mt-1">{{ formattedWeeklyTime }} of {{ weeklyGoal }} minutes</p>
            </div>
        </v-card-text>
    </v-card>
</template>

