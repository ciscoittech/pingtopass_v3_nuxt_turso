<template>
  <v-card
    :variant="cardVariant"
    :color="cardColor"
    :elevation="selected ? 2 : 0"
    class="answer-option mb-3"
    :class="{
      'option-selected': selected,
      'option-correct': showFeedback && isCorrect,
      'option-incorrect': showFeedback && selected && !isCorrect,
      'option-disabled': showFeedback
    }"
    @click="!showFeedback && $emit('select')"
  >
    <v-card-text class="pa-4">
      <div class="d-flex align-center">
        <!-- Option Label -->
        <v-avatar
          :color="avatarColor"
          :variant="selected ? 'flat' : 'tonal'"
          size="40"
          class="mr-4"
        >
          <span class="font-weight-bold">{{ optionLabel }}</span>
        </v-avatar>

        <!-- Option Text -->
        <div class="flex-grow-1">
          <p class="text-body-1 mb-0" :class="{ 'font-weight-medium': selected }">
            {{ option }}
          </p>
          
          <!-- Keyboard hint -->
          <p v-if="!showFeedback" class="text-caption text-medium-emphasis mt-1 mb-0">
            Press <kbd>{{ optionLabel.toLowerCase() }}</kbd> or <kbd>{{ index + 1 }}</kbd>
          </p>
        </div>

        <!-- Selection Indicator -->
        <v-icon
          v-if="!showFeedback"
          :color="selected ? 'primary' : 'grey-lighten-1'"
          size="28"
        >
          {{ selectionIcon }}
        </v-icon>

        <!-- Feedback Icon -->
        <v-icon
          v-else-if="showFeedback && (isCorrect || (selected && !isCorrect))"
          :color="isCorrect ? 'success' : 'error'"
          size="28"
        >
          {{ isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
        </v-icon>
      </div>

      <!-- Feedback Explanation (if provided) -->
      <v-expand-transition>
        <div v-if="showFeedback && selected && explanation" class="mt-3">
          <v-divider class="mb-3" />
          <p class="text-body-2 text-medium-emphasis mb-0">
            <v-icon size="small" class="mr-1">mdi-information</v-icon>
            {{ explanation }}
          </p>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  option: string
  index: number
  selected: boolean
  isMultipleChoice: boolean
  showFeedback?: boolean
  isCorrect?: boolean
  explanation?: string
}

const props = withDefaults(defineProps<Props>(), {
  showFeedback: false,
  isCorrect: false
})

const emit = defineEmits<{
  select: []
}>()

// Computed
const optionLabel = computed(() => {
  return String.fromCharCode(65 + props.index) // A, B, C, D...
})

const selectionIcon = computed(() => {
  return props.isMultipleChoice 
    ? (props.selected ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank')
    : (props.selected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline')
})

const cardVariant = computed(() => {
  if (props.showFeedback) {
    if (props.isCorrect) return 'tonal'
    if (props.selected && !props.isCorrect) return 'tonal'
    return 'outlined'
  }
  return props.selected ? 'tonal' : 'outlined'
})

const cardColor = computed(() => {
  if (props.showFeedback) {
    if (props.isCorrect) return 'success'
    if (props.selected && !props.isCorrect) return 'error'
    return 'default'
  }
  return props.selected ? 'primary' : 'default'
})

const avatarColor = computed(() => {
  if (props.showFeedback) {
    if (props.isCorrect) return 'success'
    if (props.selected && !props.isCorrect) return 'error'
    return 'default'
  }
  return props.selected ? 'primary' : 'default'
})
</script>

<style lang="scss" scoped>
.answer-option {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at var(--ripple-x, 50%) var(--ripple-y, 50%), 
      rgba(var(--v-theme-primary), 0.1) 0%, 
      transparent 70%);
    transform: scale(0);
    opacity: 0;
    transition: transform 0.5s ease-out, opacity 0.3s ease-out;
  }
  
  &:not(.option-disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  &:not(.option-disabled):active::before {
    transform: scale(2);
    opacity: 1;
    transition: none;
  }
  
  &.option-disabled {
    cursor: default;
  }
  
  &.option-selected:not(.option-disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2);
    animation: selectPulse 0.3s ease-out;
  }
  
  &.option-correct {
    background: rgba(var(--v-theme-success), 0.04);
    animation: correctPulse 0.5s ease-out;
  }
  
  &.option-incorrect {
    background: rgba(var(--v-theme-error), 0.04);
    animation: incorrectShake 0.5s ease-out;
  }
}

@keyframes selectPulse {
  0% {
    transform: scale(1) translateY(-1px);
  }
  50% {
    transform: scale(1.02) translateY(-1px);
  }
  100% {
    transform: scale(1) translateY(-1px);
  }
}

@keyframes correctPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes incorrectShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

kbd {
  display: inline-block;
  padding: 2px 4px;
  font-size: 0.7rem;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
}

@media (max-width: 600px) {
  .text-caption kbd {
    display: none;
  }
}
</style>