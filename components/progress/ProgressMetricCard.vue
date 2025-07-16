<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  sparklineData?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary'
});

// Chart options for sparkline
const chartOptions = computed(() => {
  if (!props.sparklineData) return null;
  
  return {
    series: [{
      name: props.title,
      data: props.sparklineData
    }],
    chart: {
      type: 'area',
      height: 60,
      sparkline: {
        enabled: true
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    colors: [`rgba(var(--v-theme-${props.color}))`],
    tooltip: {
      theme: 'dark',
      fixed: {
        enabled: false
      },
      x: {
        show: false
      }
    }
  };
});
</script>

<template>
  <v-card elevation="10" class="metric-card h-100">
    <v-card-text class="pa-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <v-avatar
          :color="color"
          variant="flat"
          size="56"
          class="metric-icon"
        >
          <Icon :icon="icon" size="28" />
        </v-avatar>
        
        <v-chip
          v-if="trend"
          :color="trend.direction === 'up' ? 'success' : trend.direction === 'down' ? 'error' : 'warning'"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          <Icon 
            :icon="trend.direction === 'up' ? 'solar:arrow-up-linear' : 
                   trend.direction === 'down' ? 'solar:arrow-down-linear' : 
                   'solar:arrow-right-linear'" 
            size="16" 
            class="mr-1" 
          />
          {{ Math.abs(trend.value) }}%
        </v-chip>
      </div>
      
      <h3 class="text-h3 font-weight-bold mb-1">{{ value }}</h3>
      <p class="text-body-2 text-grey100 mb-0">{{ title }}</p>
      <p v-if="subtitle" class="text-caption text-grey100 mb-0">{{ subtitle }}</p>
      
      <!-- Sparkline Chart -->
      <div v-if="sparklineData && chartOptions" class="mt-4">
        <ClientOnly>
          <apexchart
            type="area"
            :height="60"
            :options="chartOptions"
            :series="chartOptions.series"
          />
        </ClientOnly>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.metric-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(var(--v-theme-primary), 0.03) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-on-surface), 0.05) 0%, 
    rgba(var(--v-theme-on-surface), 0.1) 100%);
}
</style>