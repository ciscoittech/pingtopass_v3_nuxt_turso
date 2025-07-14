<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';

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
            height: 103,
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
    <v-card elevation="10">
        <v-card-text class="position-relative">
            <div class="d-flex justify-space-between d-block align-center">
                <div>
                    <h5 class="text-h5 mb-1 font-weight-semibold">
                        Study Time
                    </h5>
                    <div class="text-subtitle-1 text-grey100 pb-1 font-weight-medium">This week</div>
                </div>
                <div class="text-right">
                    <h4 class="text-h5 mb-1 font-weight-semibold">{{ formatTime(studyTime) }}</h4>
                    <v-chip color="info" class="bg-lightinfo" variant="outlined" size="x-small">
                        +12% vs last week
                    </v-chip>
                </div>
            </div>
            <div class="mt-10 mb-sm-12 mb-8">
                <ClientOnly>
                    <apexchart type="area" height="103" :options="chartOptions"
                    :series="chartOptions.series"></apexchart>
                </ClientOnly>
            </div>
            <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-1 text-grey100 font-weight-medium">This Week</div>
                <div class="text-subtitle-1 text-grey100 font-weight-medium">{{ formatTime(studyTime) }}</div>
            </div>
            <div class="d-flex align-center justify-space-between pb-1">
                <div class="text-subtitle-1 text-grey100 font-weight-medium">Last Week</div>
                <div class="text-subtitle-1 text-grey100 font-weight-medium">
                    {{ formatTime(Math.round(studyTime * 0.88)) }}
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>