<template>
  <v-avatar
    :size="size"
    :color="backgroundColor"
    :class="['vendor-icon', { 'elevation-4': elevation }]"
  >
    <!-- Iconify Icon -->
    <Icon 
      v-if="vendorConfig.icon"
      :icon="vendorConfig.icon"
      :size="iconSize"
      :color="iconColor"
      class="vendor-logo"
    />
    
    <!-- Fallback Initials -->
    <span 
      v-else
      :class="['text-' + textSize, 'font-weight-bold']"
      :style="{ color: vendorConfig.color }"
    >
      {{ vendorConfig.fallbackInitials || getInitials(vendor || 'Unknown') }}
    </span>
  </v-avatar>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { getVendorIcon, generateVendorColor } from '@/utils/vendorIcons'

interface Props {
  vendor: string | undefined
  size?: number | string
  iconSize?: number | string
  elevation?: boolean
  customColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 48,
  iconSize: 28,
  elevation: false
})

// Get vendor configuration
const vendorConfig = computed(() => {
  const vendorName = props.vendor || 'Unknown'
  const config = getVendorIcon(vendorName)
  
  // If no predefined color, generate one
  if (!config.backgroundColor && vendorName) {
    config.backgroundColor = generateVendorColor(vendorName)
  }
  
  return config
})

// Computed properties
const backgroundColor = computed(() => {
  return props.customColor || vendorConfig.value.backgroundColor || '#6366F1'
})

const iconColor = computed(() => {
  // For logo icons, we typically don't apply color (they have their own colors)
  if (vendorConfig.value.icon?.includes('logos:')) {
    return undefined
  }
  return vendorConfig.value.color || '#FFFFFF'
})

const textSize = computed(() => {
  const numSize = typeof props.size === 'string' ? parseInt(props.size) : props.size
  if (numSize >= 80) return 'h3'
  if (numSize >= 64) return 'h4'
  if (numSize >= 48) return 'h5'
  if (numSize >= 32) return 'h6'
  return 'body-2'
})

// Get initials for fallback
const getInitials = (name: string): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<style scoped>
.vendor-icon {
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  &:hover::before {
    opacity: 1;
  }
}

.vendor-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ensure logos maintain aspect ratio */
:deep(.iconify) {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}
</style>