<template>
  <v-chip
    :color="chipColor"
    :variant="variant"
    :size="size"
  >
    <template v-if="showIcon" #prepend>
      <Icon :icon="iconName" size="16" />
    </template>
    {{ displayText }}
  </v-chip>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { QuestionType } from '@/types/question'

interface Props {
  questionType: QuestionType
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'plain'
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'tonal',
  size: 'small',
  showIcon: false
})

const chipColor = computed(() => {
  switch (props.questionType) {
    case 'multiple-choice':
      return 'primary'
    case 'multiple-select':
      return 'secondary'
    case 'true-false':
      return 'info'
    case 'fill-blank':
      return 'warning'
    default:
      return 'grey'
  }
})

const iconName = computed(() => {
  switch (props.questionType) {
    case 'multiple-choice':
      return 'solar:list-check-line-duotone'
    case 'multiple-select':
      return 'solar:checklist-minimalistic-line-duotone'
    case 'true-false':
      return 'solar:alt-arrow-left-right-line-duotone'
    case 'fill-blank':
      return 'solar:text-field-line-duotone'
    default:
      return 'solar:question-circle-line-duotone'
  }
})

const displayText = computed(() => {
  switch (props.questionType) {
    case 'multiple-choice':
      return 'Multiple Choice'
    case 'multiple-select':
      return 'Multiple Select'
    case 'true-false':
      return 'True/False'
    case 'fill-blank':
      return 'Fill in the Blank'
    default:
      return 'Unknown'
  }
})
</script>