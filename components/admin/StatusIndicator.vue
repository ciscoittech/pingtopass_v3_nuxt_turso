<template>
  <div class="d-flex align-center gap-2">
    <Icon 
      :icon="statusIcon" 
      :class="statusClass"
      size="16"
    />
    <span :class="statusClass">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  active?: boolean | number
  status?: 'active' | 'inactive' | 'pending' | 'error'
  customText?: string
  customIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  active: true
})

// Convert numeric values to boolean
const isActive = computed(() => {
  if (typeof props.active === 'number') {
    return props.active === 1
  }
  return Boolean(props.active)
})

const statusText = computed(() => {
  if (props.customText) return props.customText
  if (props.status) {
    return props.status.charAt(0).toUpperCase() + props.status.slice(1)
  }
  return isActive.value ? 'Active' : 'Inactive'
})

const statusIcon = computed(() => {
  if (props.customIcon) return props.customIcon
  if (props.status === 'pending') return 'solar:clock-circle-line-duotone'
  if (props.status === 'error') return 'solar:close-circle-broken'
  return isActive.value || props.status === 'active' 
    ? 'solar:check-circle-bold' 
    : 'solar:close-circle-line-duotone'
})

const statusClass = computed(() => {
  if (props.status === 'pending') return 'text-warning'
  if (props.status === 'error') return 'text-error'
  return isActive.value || props.status === 'active' ? 'text-success' : 'text-grey'
})
</script>