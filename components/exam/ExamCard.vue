<template>
  <v-card variant="flat" class="rounded-md card-hover overflow-hidden bg-surface" data-testid="exam-card">
    <div class="position-relative">
      <!-- Exam Image/Icon Section -->
      <div class="exam-image-wrapper">
        <v-img
          v-if="image"
          :src="image"
          :alt="examName"
          height="200"
          cover
        />
        <div v-else class="exam-icon-placeholder">
          <VendorIcon 
            :vendor="examVendor"
            :size="80"
            :icon-size="48"
            elevation
          />
        </div>
      </div>
      
      <!-- Hover Action Buttons -->
      <div class="d-flex justify-end mr-3 mt-n6 position-absolute action-btn">
        <v-btn
          icon
          color="white"
          size="small"
          class="mr-3"
          @click.stop="handleBookmark"
        >
          <v-icon>{{ isBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}</v-icon>
        </v-btn>
        <v-tooltip text="Start Study" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              color="white"
              size="small"
              @click.stop="handleStartStudy"
            >
              <v-icon>mdi-play-circle</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- Card Content -->
    <v-card-item class="pt-3 text-left">
      <h6 class="text-h6 font-weight-semibold">{{ examCode }}</h6>
      <p class="text-body-2 text-grey-darken-1 mb-2 exam-name">{{ examName }}</p>
      
      <!-- Stats Row -->
      <div class="d-flex align-center justify-start mt-2">
        <v-icon icon="mdi-help-circle" color="primary" size="18" class="mr-1"></v-icon>
        <span class="font-weight-medium text-subtitle-2 mr-3">{{ examQuestionCount }} questions</span>
        
        <v-icon icon="mdi-clock-outline" color="warning" size="18" class="mr-1"></v-icon>
        <span class="font-weight-medium text-subtitle-2">{{ examDuration }}min</span>
      </div>
      
      <!-- Progress/Price Section -->
      <div class="d-flex align-center justify-start gap-2 mt-3">
        <template v-if="examProgress !== undefined">
          <div class="flex-grow-1">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption">Progress</span>
              <span class="text-caption font-weight-bold">{{ examProgress }}%</span>
            </div>
            <v-progress-linear
              :model-value="examProgress"
              :color="getProgressColor(examProgress)"
              height="6"
              rounded
            />
          </div>
        </template>
        <template v-else>
          <v-chip color="success" size="small" variant="tonal">
            Pass: {{ examPassingScore }}%
          </v-chip>
        </template>
      </div>
    </v-card-item>

    <!-- Card Actions -->
    <v-card-actions class="pa-4 pt-0">
      <v-btn
        color="primary"
        variant="tonal"
        block
        @click="handleClick"
      >
        {{ actionText }}
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="successSnackbar"
      variant="flat"
      location="bottom right"
      color="success"
      rounded="md"
      class="text-white"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
interface Exam {
  id: string
  code: string
  name: string
  vendorName?: string
  questionCount?: number
  duration?: number
  passingScore?: number
  userProgress?: number
  isBookmarked?: boolean
}

interface Props {
  // Option 1: Pass individual props
  id?: string
  code?: string
  name?: string
  vendor?: string
  image?: string
  questionCount?: number
  duration?: number
  passingScore?: number
  progress?: number
  bookmarked?: boolean
  actionText?: string
  // Option 2: Pass exam object
  exam?: Exam
}

const props = withDefaults(defineProps<Props>(), {
  bookmarked: false,
  actionText: 'Start Practicing'
})

const emit = defineEmits<{
  click: []
  bookmark: []
  'start-study': []
  'toggle-bookmark': []
  'view-details': []
  'start-exam': []
}>()

// Local state
const successSnackbar = ref(false)
const snackbarMessage = ref('')

// Computed properties to handle both exam object and individual props
const examId = computed(() => props.exam?.id || props.id || '')
const examCode = computed(() => props.exam?.code || props.code || '')
const examName = computed(() => props.exam?.name || props.name || '')
const examVendor = computed(() => props.exam?.vendorName || props.vendor || '')
const examQuestionCount = computed(() => props.exam?.questionCount || props.questionCount || 0)
const examDuration = computed(() => props.exam?.duration || props.duration || 0)
const examPassingScore = computed(() => props.exam?.passingScore || props.passingScore || 70)
const examProgress = computed(() => props.exam?.userProgress || props.progress)
const isBookmarked = computed(() => props.exam?.isBookmarked || props.bookmarked || false)

// Methods
const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'success'
  if (progress >= 60) return 'warning'
  if (progress >= 40) return 'info'
  return 'error'
}

// Handle bookmark action
watch(() => isBookmarked.value, (newVal) => {
  if (newVal) {
    snackbarMessage.value = 'Exam bookmarked'
    successSnackbar.value = true
  }
})

// Handle click events to support both patterns
const handleClick = () => {
  if (props.exam) {
    emit('view-details')
  } else {
    emit('click')
  }
}

const handleBookmark = () => {
  if (props.exam) {
    emit('toggle-bookmark')
  } else {
    emit('bookmark')
  }
}

const handleStartStudy = () => {
  if (props.exam) {
    emit('start-exam')
  } else {
    emit('start-study')
  }
}
</script>

<style lang="scss" scoped>
.exam-image-wrapper {
  height: 200px;
  position: relative;
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-primary), 0.08) 0%, 
    rgba(var(--v-theme-secondary), 0.04) 50%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
}

.exam-icon-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-primary), 0.08) 0%, 
    rgba(var(--v-theme-secondary), 0.04) 50%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
  position: relative;
  overflow: hidden;
  
  // Animated gradient overlay
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at center,
      rgba(var(--v-theme-primary), 0.06) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  
  .card-hover:hover & {
    &::before {
      opacity: 1;
    }
  }
}

.exam-name {
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.action-btn {
  top: 40px;
  right: -100% !important;
  transition: all .3s ease-in-out;
  visibility: hidden;
  
  .v-btn {
    height: 36px;
    width: 36px;
  }
}

.card-hover {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    
    .action-btn {
      right: 0 !important;
      visibility: visible;
    }
  }
}
</style>