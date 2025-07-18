<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  studyTime: number;
  weeklyProgress: number[];
}>()

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/* Chart */
const chartOptions = computed(() => {
    return {
        series: [
            {
                name: 'Study Time',
                color: 'rgba(var(--v-theme-primary))',
                data: props.weeklyProgress || [30, 45, 50, 35, 40, 55, 60],
            },
        ],
        chart: {
            fontFamily: `inherit`,
            type: "area",
            height: 80,
            sparkline: {
                enabled: true,
            },
            group: 'sparklines',
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 0,
                inverseColors: false,
                opacityFrom: 0.05,
                opacityTo: 0,
                stops: [20, 180],
            },
        },
        markers: {
            size: 0,
        },
        tooltip: {
            theme: "dark",
            fixed: {
                enabled: true,
                position: "right",
            },
            x: {
                show: false,
            },
        },
    };
});
</script>

<template>
    <v-card elevation="10" class="h-100 study-progress">
        <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center mb-3">
                <div>
                    <div class="d-flex align-center">
                        <Icon icon="solar:clock-circle-bold-duotone" size="24" class="text-info mr-2" />
                        <h5 class="text-h5 font-weight-semibold">Study Progress</h5>
                    </div>
                    <p class="text-body-2 text-grey100 mb-0 ml-8">This week's study time</p>
                </div>
                <div class="text-right">
                    <h6 class="text-h6 font-weight-semibold mb-1">{{ formatTime(studyTime) }}</h6>
                    <v-chip color="success" variant="tonal" size="small">
                        <Icon icon="solar:arrow-up-linear" size="14" class="mr-1" />
                        +12% vs last week
                    </v-chip>
                </div>
            </div>
            <div>
                <ClientOnly>
                    <apexchart type="area" height="80" :options="chartOptions"
                    :series="chartOptions.series"></apexchart>
                </ClientOnly>
            </div>
        </v-card-text>
    </v-card>
</template>