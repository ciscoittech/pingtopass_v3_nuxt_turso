<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  streak: number;
  weeklyData: number[];
}>()

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
            height: 150,
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
                columnWidth: "26%",
                borderRadius: [3],
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
                    colors: 'rgba(var(--v-theme-grey100))'
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
    <v-card elevation="10">
        <v-card-text class="position-relative">
            <div class="d-flex justify-space-between d-block align-center">
                <div>
                    <h5 class="text-h5 mb-1 font-weight-semibold">
                        Study Streak
                    </h5>
                    <div class="text-subtitle-1 text-grey100 pb-1 font-weight-medium">Last 7 days</div>
                </div>
                <div class="text-right">
                    <h4 class="text-h5 mb-1 font-weight-semibold">{{ streak }}</h4>
                    <v-chip color="success" class="bg-lightsuccess" variant="outlined" size="x-small">
                        {{ streak > 1 ? 'days' : 'day' }}
                    </v-chip>
                </div>
            </div>
            <div class="mb-4">
                <ClientOnly>
                    <apexchart type="bar" class="paymentchart" height="150" :options="chartOptions"
                    :series="chartOptions.series"></apexchart>
                </ClientOnly>
            </div>
            <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                    <Icon icon="solar:fire-linear" size="16" class="text-warning" />
                    <div class="text-subtitle-1 text-grey100 font-weight-medium ml-1">Current Streak</div>
                </div>
                <div class="text-subtitle-1 text-grey100 font-weight-medium">{{ streak }} days</div>
            </div>
            <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                    <Icon icon="solar:trophy-linear" size="16" class="text-grey100 text-disabled" />
                    <div class="text-subtitle-1 text-grey100 font-weight-medium ml-1">Best Streak</div>
                </div>
                <div class="text-subtitle-1 text-grey100 font-weight-medium">{{ Math.max(streak, 7) }} days</div>
            </div>
        </v-card-text>
    </v-card>
</template>