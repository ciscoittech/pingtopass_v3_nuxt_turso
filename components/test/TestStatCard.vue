<template>
  <v-card
    elevation="0"
    rounded="lg"
    class="stat-card h-100"
    :class="`stat-card--${color}`"
  >
    <v-card-text class="pa-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <v-avatar
          :color="color"
          variant="flat"
          size="56"
          class="stat-icon"
        >
          <v-icon :icon="icon" size="28" />
        </v-avatar>
        
        <v-chip
          v-if="trend !== null"
          :color="trend > 0 ? 'success' : 'error'"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          <v-icon size="16" start>
            {{ trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
          </v-icon>
          {{ Math.abs(trend) }}%
        </v-chip>
      </div>
      
      <h3 class="text-h3 font-weight-bold mb-1">
        {{ formattedValue }}
      </h3>
      
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ title }}
      </p>
      
      <div v-if="subtitle" class="mt-3">
        <p class="text-caption text-medium-emphasis mb-0">
          {{ subtitle }}
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: number | string
  icon: string
  color?: string
  trend?: number | null
  subtitle?: string
  format?: 'number' | 'percent' | 'time'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  trend: null,
  format: 'number'
})

const formattedValue = computed(() => {
  if (props.format === 'percent') {
    return `${props.value}%`
  }
  if (props.format === 'time' && typeof props.value === 'number') {
    const hours = Math.floor(props.value / 3600)
    const minutes = Math.floor((props.value % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  return props.value.toString()
})
</script>

<style lang="scss" scoped>
.stat-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  &--primary {
    .stat-icon {
      background: linear-gradient(135deg, 
        rgba(var(--v-theme-primary), 0.1) 0%, 
        rgba(var(--v-theme-primary), 0.2) 100%);
    }
  }
  
  &--success {
    .stat-icon {
      background: linear-gradient(135deg, 
        rgba(var(--v-theme-success), 0.1) 0%, 
        rgba(var(--v-theme-success), 0.2) 100%);
    }
  }
  
  &--info {
    .stat-icon {
      background: linear-gradient(135deg, 
        rgba(var(--v-theme-info), 0.1) 0%, 
        rgba(var(--v-theme-info), 0.2) 100%);
    }
  }
  
  &--warning {
    .stat-icon {
      background: linear-gradient(135deg, 
        rgba(var(--v-theme-warning), 0.1) 0%, 
        rgba(var(--v-theme-warning), 0.2) 100%);
    }
  }
}
</style>