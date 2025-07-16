<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface ExamPerformance {
  exam: {
    id: string;
    code: string;
    name: string;
  };
  statistics: {
    accuracy: number;
    totalStudyTime: number;
    totalQuestions: number;
    masteryLevel: string;
    improvementTrend: string;
    testsTaken?: number;
    bestTestScore?: number;
  };
}

interface Props {
  examData: ExamPerformance;
}

const props = defineProps<Props>();

// Helper functions
const getMasteryColor = (level: string) => {
  const colors: Record<string, string> = {
    expert: 'purple',
    advanced: 'success',
    intermediate: 'warning',
    beginner: 'info'
  };
  return colors[level] || 'info';
};

const getMasteryIcon = (level: string) => {
  const icons: Record<string, string> = {
    expert: 'solar:star-bold',
    advanced: 'solar:medal-star-bold',
    intermediate: 'solar:cup-bold',
    beginner: 'solar:book-2-bold'
  };
  return icons[level] || 'solar:book-2-bold';
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getProgressSegments = computed(() => {
  const accuracy = props.examData.statistics.accuracy;
  return [
    { value: Math.min(accuracy, 25), color: 'error' },
    { value: Math.max(0, Math.min(accuracy - 25, 25)), color: 'warning' },
    { value: Math.max(0, Math.min(accuracy - 50, 25)), color: 'info' },
    { value: Math.max(0, Math.min(accuracy - 75, 25)), color: 'success' }
  ];
});
</script>

<template>
  <v-hover v-slot="{ isHovering, props: hoverProps }">
    <v-card
      v-bind="hoverProps"
      elevation="10"
      class="exam-performance-card h-100"
      :class="{ 'exam-performance-card--hover': isHovering }"
    >
      <v-card-text class="pa-5">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center">
            <v-avatar
              :color="getMasteryColor(examData.statistics.masteryLevel)"
              variant="flat"
              size="44"
              class="mr-3"
            >
              <Icon :icon="getMasteryIcon(examData.statistics.masteryLevel)" size="24" />
            </v-avatar>
            <div>
              <h4 class="text-h6 font-weight-bold mb-0">{{ examData.exam.code }}</h4>
              <p class="text-caption text-grey100 mb-0 line-clamp-1">{{ examData.exam.name }}</p>
            </div>
          </div>
          
          <v-chip
            :color="getMasteryColor(examData.statistics.masteryLevel)"
            size="small"
            variant="tonal"
            class="font-weight-medium"
          >
            {{ examData.statistics.masteryLevel }}
          </v-chip>
        </div>

        <!-- Circular Progress -->
        <div class="text-center my-6">
          <v-progress-circular
            :model-value="examData.statistics.accuracy"
            :size="120"
            :width="12"
            :color="getMasteryColor(examData.statistics.masteryLevel)"
            class="exam-progress-circle"
          >
            <div>
              <div class="text-h4 font-weight-bold">{{ Math.round(examData.statistics.accuracy) }}%</div>
              <div class="text-caption text-grey100">Accuracy</div>
            </div>
          </v-progress-circular>
        </div>

        <!-- Stats Grid -->
        <v-row dense class="mb-4">
          <v-col cols="6">
            <div class="stat-item">
              <Icon icon="solar:clock-circle-linear" size="16" class="text-grey100 mr-1" />
              <span class="text-caption text-grey100">Study Time</span>
              <p class="text-subtitle-2 font-weight-bold mb-0">{{ formatTime(examData.statistics.totalStudyTime) }}</p>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-item">
              <Icon icon="solar:question-circle-linear" size="16" class="text-grey100 mr-1" />
              <span class="text-caption text-grey100">Questions</span>
              <p class="text-subtitle-2 font-weight-bold mb-0">{{ examData.statistics.totalQuestions }}</p>
            </div>
          </v-col>
          <v-col v-if="examData.statistics.testsTaken" cols="6">
            <div class="stat-item">
              <Icon icon="solar:document-text-linear" size="16" class="text-grey100 mr-1" />
              <span class="text-caption text-grey100">Tests Taken</span>
              <p class="text-subtitle-2 font-weight-bold mb-0">{{ examData.statistics.testsTaken }}</p>
            </div>
          </v-col>
          <v-col v-if="examData.statistics.bestTestScore" cols="6">
            <div class="stat-item">
              <Icon icon="solar:trophy-linear" size="16" class="text-grey100 mr-1" />
              <span class="text-caption text-grey100">Best Score</span>
              <p class="text-subtitle-2 font-weight-bold mb-0">{{ examData.statistics.bestTestScore }}%</p>
            </div>
          </v-col>
        </v-row>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="d-flex justify-space-between align-center mb-1">
            <span class="text-caption text-grey100">Mastery Progress</span>
            <span class="text-caption font-weight-bold">{{ Math.round(examData.statistics.accuracy) }}%</span>
          </div>
          <v-progress-linear
            :model-value="examData.statistics.accuracy"
            :color="getMasteryColor(examData.statistics.masteryLevel)"
            height="8"
            rounded
            class="mastery-progress"
          />
        </div>

        <!-- Trend Indicator -->
        <div v-if="examData.statistics.improvementTrend !== 'stable'" class="mt-3 text-center">
          <v-chip
            :color="examData.statistics.improvementTrend === 'improving' ? 'success' : 'warning'"
            size="x-small"
            variant="tonal"
            class="font-weight-medium"
          >
            <Icon 
              :icon="examData.statistics.improvementTrend === 'improving' ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'" 
              size="14" 
              class="mr-1" 
            />
            {{ examData.statistics.improvementTrend }}
          </v-chip>
        </div>

        <!-- Action Button -->
        <v-btn
          color="primary"
          variant="tonal"
          block
          class="mt-4 action-btn"
          :to="`/study/${examData.exam.id}`"
        >
          Continue Studying
          <Icon icon="solar:arrow-right-linear" class="ml-2" size="18" />
        </v-btn>
      </v-card-text>
    </v-card>
  </v-hover>
</template>

<style scoped>
.exam-performance-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.exam-performance-card--hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exam-progress-circle {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
}

.mastery-progress {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.action-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateX(2px);
}
</style>