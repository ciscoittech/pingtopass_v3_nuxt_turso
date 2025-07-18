<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  userName: string;
  totalExams: number;
  completedExams: number;
  studyStreak: number;
  studyHours: number;
}

const props = withDefaults(defineProps<Props>(), {
  userName: 'Student',
  totalExams: 0,
  completedExams: 0,
  studyStreak: 0,
  studyHours: 0
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
                <v-col cols="4" class="text-center">
                    <div class="pa-2 rounded bg-lightsuccess">
                        <Icon icon="solar:book-2-bold-duotone" size="24" class="text-success mb-1" />
                        <h6 class="text-h6 font-weight-bold mb-0">{{ totalExams }}</h6>
                        <p class="text-caption text-grey100 mb-0">Exams</p>
                    </div>
                </v-col>
                <v-col cols="4" class="text-center">
                    <div class="pa-2 rounded bg-lightwarning">
                        <Icon icon="solar:fire-bold-duotone" size="24" class="text-warning mb-1" />
                        <h6 class="text-h6 font-weight-bold mb-0">{{ studyStreak }}</h6>
                        <p class="text-caption text-grey100 mb-0">Day Streak</p>
                    </div>
                </v-col>
                <v-col cols="4" class="text-center">
                    <div class="pa-2 rounded bg-lightinfo">
                        <Icon icon="solar:clock-circle-bold-duotone" size="24" class="text-info mb-1" />
                        <h6 class="text-h6 font-weight-bold mb-0">{{ formattedHours }}</h6>
                        <p class="text-caption text-grey100 mb-0">Today</p>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

