<template>
  <v-skeleton-loader
    v-bind="$attrs"
    :type="safeType"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: string | null | undefined
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text'
})

// List of valid skeleton loader types from Vuetify
const validTypes = [
  'article',
  'avatar',
  'button',
  'card',
  'card-avatar',
  'chip',
  'date-picker',
  'date-picker-days',
  'date-picker-months',
  'heading',
  'image',
  'list-item',
  'list-item-avatar',
  'list-item-two-line',
  'list-item-avatar-two-line',
  'list-item-three-line',
  'list-item-avatar-three-line',
  'paragraph',
  'sentences',
  'subtitle',
  'table',
  'table-cell',
  'table-heading',
  'table-row',
  'table-row-divider',
  'table-tbody',
  'table-tfoot',
  'table-thead',
  'text',
  'linear-progress'
]

// Ensure type is always a valid string
const safeType = computed(() => {
  const typeValue = props.type
  
  // Handle null, undefined, or empty string
  if (!typeValue) {
    return 'text'
  }
  
  // Convert to string if needed
  const typeStr = String(typeValue).trim()
  
  // Check if it's a valid type
  if (validTypes.includes(typeStr)) {
    return typeStr
  }
  
  // Default to 'text' if invalid
  console.warn(`Invalid skeleton loader type: "${typeStr}". Defaulting to "text".`)
  return 'text'
})
</script>