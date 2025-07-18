<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  streak: number;
  weeklyData: number[];
}>()

// Calculate best streak
const bestStreak = computed(() => {
  let maxStreak = 0;
  let currentStreak = 0;
  
  props.weeklyData?.forEach(day => {
    if (day > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  return Math.max(maxStreak, props.streak);
});

/* Chart */
const chartOptions = computed(() => {
    return {
        series: [
            {
                name: "Study Days",
                data: props.weeklyData || [1, 1, 1, 0, 1, 1, 1],
            }
        ],
        chart: {
            fontFamily: `inherit`,
            type: "bar",
            height: 80,
            toolbar: {
                show: false,
            },
        },
        grid: {
            show: false,
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
        },
        colors: ['rgba(var(--v-theme-primary))'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "40%",
                borderRadius: [2],
                borderRadiusApplication: 'end',
            },
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: [["M"], ["T"], ["W"], ["T"], ["F"], ["S"], ["S"]],
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: 'rgba(var(--v-theme-grey100))',
                    fontSize: '10px'
                }
            }
        },
        yaxis: {
            labels: {
                show: false,
            },
        },
        tooltip: {
            theme: "dark",
        },
        legend: {
            show: false,
        },
    };
});
</script>

<template>
    <v-card elevation="10" class="h-100">
        <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-center mb-2">
                <div class="d-flex align-center">
                    <Icon icon="solar:fire-bold-duotone" size="20" class="text-warning mr-2" />
                    <h6 class="text-h6 font-weight-semibold">{{ streak }} Day Streak</h6>
                </div>
                <v-chip color="success" variant="tonal" size="x-small">
                    Best: {{ bestStreak }}
                </v-chip>
            </div>
            <div class="mb-2">
                <ClientOnly>
                    <apexchart type="bar" height="80" :options="chartOptions"
                    :series="chartOptions.series"></apexchart>
                </ClientOnly>
            </div>
            <p class="text-caption text-grey100 mb-0 text-center">
                Keep it up! Don't break your streak today
            </p>
        </v-card-text>
    </v-card>
</template>