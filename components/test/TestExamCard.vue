<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      v-bind="props"
      elevation="0"
      rounded="lg"
      class="exam-test-card h-100"
      :class="{ 'exam-test-card--hover': isHovering }"
    >
      <div class="card-header pa-5 pb-0">
        <div class="d-flex align-center justify-space-between mb-3">
          <v-avatar
            :color="vendorColor"
            variant="flat"
            size="48"
          >
            <v-icon size="24">mdi-certificate</v-icon>
          </v-avatar>
          
          <v-chip
            v-if="userStats"
            :color="getScoreColor(userStats.bestScore)"
            variant="tonal"
            size="small"
            class="font-weight-medium"
          >
            Best: {{ userStats.bestScore }}%
          </v-chip>
        </div>
        
        <h4 class="text-h6 font-weight-bold mb-1">{{ exam.examCode }}</h4>
        <p class="text-body-2 text-medium-emphasis line-clamp-2">
          {{ exam.examName }}
        </p>
      </div>
      
      <v-card-text class="pa-5 pt-3">
        <!-- Exam Details -->
        <div class="exam-details mb-4">
          <div class="detail-item">
            <v-icon size="16" color="primary" start>mdi-help-circle</v-icon>
            <span class="text-body-2">{{ exam.numberOfQuestions }} questions</span>
          </div>
          <div class="detail-item">
            <v-icon size="16" color="info" start>mdi-clock-outline</v-icon>
            <span class="text-body-2">{{ exam.examDuration }} minutes</span>
          </div>
          <div class="detail-item">
            <v-icon size="16" color="success" start>mdi-check-decagram</v-icon>
            <span class="text-body-2">Pass: {{ exam.passingScore }}%</span>
          </div>
        </div>
        
        <!-- User Progress -->
        <div v-if="userStats" class="user-progress">
          <v-divider class="mb-3" />
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption text-medium-emphasis">Your Progress</span>
            <span class="text-caption font-weight-bold">
              {{ userStats.attempts }} {{ userStats.attempts === 1 ? 'attempt' : 'attempts' }}
            </span>
          </div>
          <v-progress-linear
            :model-value="userStats.bestScore"
            :color="getScoreColor(userStats.bestScore)"
            height="6"
            rounded
            class="mb-1"
          />
          <div class="d-flex justify-space-between">
            <span class="text-caption">
              Avg: {{ Math.round(userStats.avgScore) }}%
            </span>
            <span class="text-caption">
              Last: {{ formatRelativeTime(userStats.lastAttempt) }}
            </span>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-5 pt-0">
        <v-btn
          color="primary"
          variant="flat"
          block
          size="large"
          @click="$emit('start-test', exam.id)"
          class="action-btn"
        >
          {{ userStats ? 'Retake Test' : 'Start Test' }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-hover>
</template>

<script setup lang="ts">
interface Exam {
  id: string
  examCode: string
  examName: string
  vendorId: string
  vendorName: string
  numberOfQuestions: number
  examDuration: number
  passingScore: number
}

interface UserStats {
  bestScore: number
  avgScore: number
  attempts: number
  lastAttempt: number
}

interface Props {
  exam: Exam
  userStats?: UserStats | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'start-test': [examId: string]
}>()

// Vendor color mapping
const vendorColors: Record<string, string> = {
  microsoft: 'blue',
  aws: 'orange',
  google: 'green',
  cisco: 'red',
  comptia: 'purple',
  default: 'primary'
}

const vendorColor = computed(() => {
  const vendor = props.exam.vendorName?.toLowerCase() || ''
  return Object.keys(vendorColors).find(key => vendor.includes(key)) 
    ? vendorColors[Object.keys(vendorColors).find(key => vendor.includes(key))!] 
    : vendorColors.default
})

// Helper functions
const getScoreColor = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'info'
  if (score >= 50) return 'warning'
  return 'error'
}

const formatRelativeTime = (timestamp: number) => {
  if (!timestamp) return 'Never'
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
</script>

<style lang="scss" scoped>
.exam-test-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &--hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: rgba(var(--v-theme-primary), 0.3);
  }
  
  .card-header {
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(var(--v-border-color), 0.2),
        transparent
      );
    }
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .exam-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .action-btn {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateX(2px);
    }
  }
}
</style>