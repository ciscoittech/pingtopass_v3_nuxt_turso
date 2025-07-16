<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { DotsVerticalIcon } from 'vue-tabler-icons';

interface Props {
  title: string;
  subtitle?: string;
  chartType: 'line' | 'area' | 'bar';
  data: {
    labels: string[];
    datasets: Array<{
      name: string;
      data: number[];
      color?: string;
    }>;
  };
  height?: number;
  showLegend?: boolean;
  actions?: Array<{
    title: string;
    value: string;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  showLegend: true,
  chartType: 'area'
});

const selectedAction = ref('');

// Chart configuration
const chartOptions = computed(() => {
  const colors = props.data.datasets.map(d => 
    d.color || `rgba(var(--v-theme-primary))`
  );

  return {
    series: props.data.datasets.map(dataset => ({
      name: dataset.name,
      data: dataset.data
    })),
    chart: {
      type: props.chartType,
      height: props.height,
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    colors,
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: props.chartType === 'line' ? 3 : 2
    },
    fill: {
      type: props.chartType === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    grid: {
      borderColor: 'rgba(var(--v-theme-borderColor))',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        bottom: 0,
        left: 20,
        right: 20
      }
    },
    xaxis: {
      categories: props.data.labels,
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: 'rgba(var(--v-theme-grey100))'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'rgba(var(--v-theme-grey100))'
        }
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true
      },
      y: {
        formatter: function(val: number) {
          return val.toFixed(0);
        }
      }
    },
    legend: {
      show: props.showLegend,
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5,
      labels: {
        colors: 'rgba(var(--v-theme-grey100))'
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '50%'
      }
    }
  };
});
</script>

<template>
  <v-card elevation="10" class="analytics-chart-card">
    <v-card-item>
      <div class="d-flex align-center justify-space-between">
        <div>
          <h5 class="text-h5 mb-1 font-weight-semibold">{{ title }}</h5>
          <p v-if="subtitle" class="text-subtitle-2 text-grey100">{{ subtitle }}</p>
        </div>
        <div v-if="actions && actions.length > 0">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon color="inherit" v-bind="props" variant="text">
                <DotsVerticalIcon stroke-width="1.5" size="24" class="text-grey100" />
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item 
                v-for="(action, i) in actions" 
                :key="i" 
                :value="action.value"
                @click="selectedAction = action.value"
              >
                <v-list-item-title>{{ action.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-card-item>
    
    <v-card-text>
      <ClientOnly>
        <apexchart
          :type="chartType"
          :height="height"
          :options="chartOptions"
          :series="chartOptions.series"
        />
      </ClientOnly>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.analytics-chart-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}
</style>