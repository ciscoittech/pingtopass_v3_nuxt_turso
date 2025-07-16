<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  currentStreak: number;
  longestStreak: number;
  correctAnswers: number;
  totalQuestions: number;
  overallAccuracy: number;
}

const props = defineProps<Props>();

// Computed properties
const getStreakMessage = computed(() => {
  const streak = props.currentStreak;
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return 'Great start! Keep going!';
  if (streak < 7) return `${streak} days strong! Keep it up! 🔥`;
  if (streak < 30) return `Amazing ${streak}-day streak! You're on fire! 🚀`;
  return `Incredible ${streak}-day streak! You're unstoppable! ⭐`;
});

const streakProgress = computed(() => {
  // Progress towards next milestone (7, 14, 30, 60, 100 days)
  const milestones = [7, 14, 30, 60, 100];
  const currentMilestone = milestones.find(m => m > props.currentStreak) || 100;
  const previousMilestone = milestones.reverse().find(m => m <= props.currentStreak) || 0;
  
  const progress = ((props.currentStreak - previousMilestone) / (currentMilestone - previousMilestone)) * 100;
  return {
    progress: Math.min(progress, 100),
    nextMilestone: currentMilestone
  };
});
</script>

<template>
  <v-card elevation="10" class="streak-overview-card">
    <div class="card-gradient"></div>
    <v-card-text class="position-relative">
      <v-row>
        <v-col cols="12" md="8">
          <h2 class="text-h4 font-weight-bold mb-3">{{ getStreakMessage }}</h2>
          
          <div class="d-flex flex-wrap gap-4 mb-4">
            <div class="streak-stat">
              <v-avatar color="primary" variant="flat" size="48" class="mb-2">
                <Icon icon="solar:fire-bold" size="24" />
              </v-avatar>
              <h3 class="text-h3 font-weight-bold">{{ currentStreak }}</h3>
              <p class="text-body-2 text-grey100">Current Streak</p>
            </div>
            
            <div class="streak-stat">
              <v-avatar color="warning" variant="flat" size="48" class="mb-2">
                <Icon icon="solar:trophy-bold" size="24" />
              </v-avatar>
              <h3 class="text-h3 font-weight-bold">{{ longestStreak }}</h3>
              <p class="text-body-2 text-grey100">Best Streak</p>
            </div>
            
            <div class="streak-stat">
              <v-avatar color="success" variant="flat" size="48" class="mb-2">
                <Icon icon="solar:check-circle-bold" size="24" />
              </v-avatar>
              <h3 class="text-h3 font-weight-bold">{{ correctAnswers }}</h3>
              <p class="text-body-2 text-grey100">Correct Answers</p>
            </div>
            
            <div class="streak-stat">
              <v-avatar color="info" variant="flat" size="48" class="mb-2">
                <Icon icon="solar:chart-2-bold" size="24" />
              </v-avatar>
              <h3 class="text-h3 font-weight-bold">{{ overallAccuracy }}%</h3>
              <p class="text-body-2 text-grey100">Accuracy Rate</p>
            </div>
          </div>
          
          <!-- Milestone Progress -->
          <div class="milestone-progress">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2 text-grey100">Progress to {{ streakProgress.nextMilestone }}-day milestone</span>
              <span class="text-subtitle-2 font-weight-bold">{{ Math.round(streakProgress.progress) }}%</span>
            </div>
            <v-progress-linear
              :model-value="streakProgress.progress"
              color="primary"
              height="8"
              rounded
              class="milestone-bar"
            />
          </div>
        </v-col>
        
        <v-col cols="12" md="4" class="d-flex align-center justify-center">
          <div class="streak-visual">
            <v-progress-circular
              :model-value="Math.min((currentStreak / 30) * 100, 100)"
              :size="180"
              :width="16"
              color="primary"
              class="streak-circle"
            >
              <div class="text-center">
                <Icon icon="solar:fire-bold-duotone" size="48" class="text-primary mb-2" />
                <div class="text-h3 font-weight-bold">{{ currentStreak }}</div>
                <div class="text-caption text-grey100">Day Streak</div>
              </div>
            </v-progress-circular>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.streak-overview-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}

.card-gradient {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, 
    transparent 0%, 
    rgba(var(--v-theme-primary), 0.05) 100%);
  pointer-events: none;
}

.streak-stat {
  text-align: center;
  min-width: 100px;
}

.milestone-progress {
  max-width: 500px;
}

.milestone-bar {
  background: rgba(var(--v-theme-primary), 0.1);
}

.streak-visual {
  position: relative;
}

.streak-circle {
  filter: drop-shadow(0 8px 24px rgba(var(--v-theme-primary), 0.15));
}

@media (max-width: 960px) {
  .streak-stat {
    min-width: 80px;
  }
  
  .streak-stat h3 {
    font-size: 1.5rem;
  }
}
</style>