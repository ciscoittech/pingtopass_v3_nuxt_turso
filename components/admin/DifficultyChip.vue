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

interface Props {
  difficulty: 'easy' | 'intermediate' | 'hard'
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
  switch (props.difficulty) {
    case 'easy':
      return 'success'
    case 'intermediate':
      return 'warning'
    case 'hard':
      return 'error'
    default:
      return 'grey'
  }
})

const iconName = computed(() => {
  switch (props.difficulty) {
    case 'easy':
      return 'solar:star-bold'
    case 'intermediate':
      return 'solar:star-half-bold'
    case 'hard':
      return 'solar:fire-bold'
    default:
      return 'solar:question-circle-line-duotone'
  }
})

const displayText = computed(() => {
  return props.difficulty.charAt(0).toUpperCase() + props.difficulty.slice(1)
})
</script>