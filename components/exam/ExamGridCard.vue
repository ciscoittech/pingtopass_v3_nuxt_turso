<template>
  <v-card 
    :elevation="hover ? 12 : 10"
    variant="flat"
    class="exam-grid-card card-hover h-100 cursor-pointer rounded-lg overflow-hidden bg-surface"
    @click="navigateToExam"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- Exam Image/Vendor Section -->
    <div class="exam-image-wrapper position-relative">
      <div class="exam-vendor-display d-flex align-center justify-center">
        <SharedVendorIcon 
          :vendor="exam.vendorName"
          :size="100"
          :icon-size="60"
          elevation
        />
      </div>
      
      <!-- Hover Actions -->
      <div class="hover-actions position-absolute">
        <v-btn
          icon
          color="white"
          size="small"
          class="mb-2"
          @click.stop="toggleBookmark"
        >
          <Icon 
            :icon="exam.isBookmarked ? 'solar:bookmark-bold-duotone' : 'solar:bookmark-line-duotone'" 
            size="20" 
          />
        </v-btn>
        <v-btn
          icon
          color="white"
          size="small"
          @click.stop="startStudy"
        >
          <Icon icon="solar:play-circle-bold" size="20" />
        </v-btn>
      </div>
      
      <!-- Status Badge -->
      <v-chip
        v-if="exam.userProgress > 0"
        color="success"
        size="x-small"
        class="status-badge"
      >
        {{ exam.userProgress }}% Complete
      </v-chip>
    </div>

    <!-- Card Content -->
    <v-card-text class="pt-4">
      <!-- Exam Code & Name -->
      <h6 class="text-h6 font-weight-semibold mb-1 exam-title text-left">
        {{ exam.examCode }}
      </h6>
      <p class="text-body-2 text-grey100 mb-3 exam-name text-left">
        {{ exam.examName }}
      </p>

      <!-- Vendor & Difficulty -->
      <div class="d-flex align-center gap-2 mb-3">
        <v-chip size="x-small" variant="tonal" color="primary">
          {{ exam.vendorName }}
        </v-chip>
        <v-chip size="x-small" variant="text" class="text-capitalize">
          {{ exam.difficulty || 'intermediate' }}
        </v-chip>
      </div>

      <!-- Progress Bar -->
      <div v-if="exam.userProgress > 0" class="mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption">Progress</span>
          <span class="text-caption font-weight-semibold">{{ exam.userProgress }}%</span>
        </div>
        <v-progress-linear
          :model-value="exam.userProgress"
          color="primary"
          height="6"
          rounded
        />
      </div>

      <!-- Exam Stats -->
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-3">
          <div class="d-flex align-center">
            <Icon icon="solar:document-text-line-duotone" size="18" class="mr-1 text-grey100" />
            <span class="text-body-2 text-grey100">{{ exam.numberOfQuestions }}</span>
          </div>
          <div class="d-flex align-center">
            <Icon icon="solar:clock-circle-line-duotone" size="18" class="mr-1 text-grey100" />
            <span class="text-body-2 text-grey100">{{ exam.examDuration }}m</span>
          </div>
        </div>
        <div class="d-flex align-center">
          <v-chip size="x-small" color="success" variant="tonal">
            {{ exam.passingScore }}% to pass
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Exam } from '@/types/exam'

const props = defineProps<{
  exam: Exam
}>()

const emit = defineEmits<{
  bookmark: [exam: Exam]
}>()

const hover = ref(false)
const router = useRouter()

// Navigation
const navigateToExam = () => {
  router.push(`/exams/${props.exam.id}`)
}

const startStudy = () => {
  router.push(`/study/${props.exam.id}`)
}

const toggleBookmark = () => {
  emit('bookmark', props.exam)
}
</script>

<style lang="scss" scoped>
.exam-grid-card {
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    
    .exam-image-wrapper {
      &::before {
        opacity: 1;
      }
      
      &::after {
        transform: translateX(0);
      }
    }
    
    .hover-actions {
      right: 16px !important;
      visibility: visible;
    }
  }
}

.exam-image-wrapper {
  height: 200px;
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-primary), 0.05) 0%, 
    rgba(var(--v-theme-secondary), 0.02) 50%,
    rgba(var(--v-theme-primary), 0.01) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(var(--v-theme-borderColor), 0.08);
  
  // Animated gradient overlay
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at center,
      rgba(var(--v-theme-primary), 0.1) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  
  // Slide effect
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 70%
    );
    transform: translateX(-100%);
    transition: transform 0.8s ease;
  }
}

.exam-vendor-display {
  height: 100%;
  position: relative;
  z-index: 1;
  
  :deep(.vendor-icon) {
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.95) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
  
  .exam-grid-card:hover & {
    :deep(.vendor-icon) {
      transform: scale(1.08);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }
  }
}

.hover-actions {
  top: 12px;
  right: -100% !important;
  transition: all 0.3s ease-in-out;
  visibility: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2;
  
  .v-btn {
    height: 36px;
    width: 36px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
}

.exam-title {
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
}

.exam-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
  line-height: 1.4;
}

// Typography improvements
:deep(.v-card-item) {
  padding-bottom: 16px !important;
}

// Ensure proper text contrast
:deep(.text-grey100) {
  opacity: 0.7;
}

:deep(.text-grey200) {
  opacity: 0.8;
}

// Remove duplicate transition effects
.card-hover {
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(var(--v-theme-primary), 0.02);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
  }
  
  &:hover::before {
    opacity: 1;
  }
}

// Enhanced vendor chip styling
:deep(.v-chip) {
  font-weight: 600;
  letter-spacing: 0.025em;
}

// Progress bar enhancement
:deep(.v-progress-linear) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>