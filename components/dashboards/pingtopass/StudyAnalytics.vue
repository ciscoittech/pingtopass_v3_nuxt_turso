<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { DotsVerticalIcon } from 'vue-tabler-icons';
import { Icon } from '@iconify/vue';

interface Props {
  weeklyData?: {
    questions: number[];
    studyTime: number[];
    accuracy: number[];
  };
}

const props = withDefaults(defineProps<Props>(), {
  weeklyData: () => ({
    questions: [120, 180, 150, 200, 220, 240, 280],
    studyTime: [60, 90, 75, 100, 110, 120, 140],
    accuracy: [75, 78, 80, 82, 85, 88, 90]
  })
});

const selectedMetric = ref('questions');
const items = ref([
    { title: "Questions Answered", value: 'questions' },
    { title: "Study Time", value: 'studyTime' },
    { title: "Accuracy Rate", value: 'accuracy' },
]);

/* Chart */
const chartOptions = computed(() => {
    const seriesData = {
        questions: [
            {
                name: "Questions Answered",
                data: props.weeklyData.questions,
            }
        ],
        studyTime: [
            {
                name: "Study Time (minutes)",
                data: props.weeklyData.studyTime,
            }
        ],
        accuracy: [
            {
                name: "Accuracy %",
                data: props.weeklyData.accuracy,
            }
        ]
    };

    return {
        series: seriesData[selectedMetric.value],
        colors: ['rgba(var(--v-theme-primary))'],
        chart: {
            type: "area",
            fontFamily: `inherit`,
            foreColor: "#adb0bb",
            width: "100%",
            height: 300,
            toolbar: {
                show: false,
            },
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
        stroke: {
            curve: 'smooth',
            width: 3
        },
        dataLabels: {
            enabled: false,
        },
        grid: {
            borderColor: 'rgba(var(--v-theme-borderColor))',
            padding: { top: 0, bottom: -8, left: 20, right: 20 },
        },
        tooltip: {
            theme: "dark",
        },
        xaxis: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: 'rgba(var(--v-theme-grey100))',
                }
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: 'rgba(var(--v-theme-grey100))',
                },
                formatter: function(val: number) {
                    if (selectedMetric.value === 'accuracy') {
                        return val + '%';
                    }
                    return val;
                }
            },
        },
        legend: {
            show: false,
        },
    };
});

// Calculate totals
const weeklyTotal = computed(() => {
    const data = props.weeklyData[selectedMetric.value];
    return data.reduce((sum, val) => sum + val, 0);
});

const dailyAverage = computed(() => {
    return Math.round(weeklyTotal.value / 7);
});

const percentChange = computed(() => {
    const data = props.weeklyData[selectedMetric.value];
    const lastWeek = data[data.length - 1];
    const previousWeek = data[0];
    const change = ((lastWeek - previousWeek) / previousWeek) * 100;
    return Math.round(change);
});
</script>

<template>
    <v-card elevation="10">
        <v-card-item>
            <div class="d-flex align-center justify-space-between">
                <div>
                    <h5 class="text-h5 mb-1 font-weight-semibold">Study Analytics</h5>
                    <p class="text-subtitle-2 text-grey100">Weekly performance metrics</p>
                </div>
                <div>
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon color="inherit" v-bind="props" variant="text">
                                <DotsVerticalIcon stroke-width="1.5" size="24" class="text-grey100" />
                            </v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item 
                                v-for="(item, i) in items" 
                                :key="i" 
                                :value="item.value"
                                @click="selectedMetric = item.value"
                            >
                                <v-list-item-title>{{ item.title }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </div>
            
            <!-- Stats Row -->
            <v-row class="mt-4 mb-2">
                <v-col cols="4">
                    <div class="text-center">
                        <Icon 
                            :icon="selectedMetric === 'questions' ? 'solar:question-circle-linear' : 
                                   selectedMetric === 'studyTime' ? 'solar:clock-circle-linear' : 
                                   'solar:chart-linear'" 
                            class="text-primary mb-1" 
                            size="24" 
                        />
                        <h6 class="text-h6 font-weight-semibold">{{ weeklyTotal }}</h6>
                        <p class="text-caption text-grey100">Weekly Total</p>
                    </div>
                </v-col>
                <v-col cols="4">
                    <div class="text-center">
                        <Icon icon="solar:calendar-linear" class="text-info mb-1" size="24" />
                        <h6 class="text-h6 font-weight-semibold">{{ dailyAverage }}</h6>
                        <p class="text-caption text-grey100">Daily Average</p>
                    </div>
                </v-col>
                <v-col cols="4">
                    <div class="text-center">
                        <Icon 
                            :icon="percentChange >= 0 ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'" 
                            :class="percentChange >= 0 ? 'text-success' : 'text-error'" 
                            class="mb-1" 
                            size="24" 
                        />
                        <h6 class="text-h6 font-weight-semibold">{{ Math.abs(percentChange) }}%</h6>
                        <p class="text-caption text-grey100">Weekly Change</p>
                    </div>
                </v-col>
            </v-row>
        </v-card-item>
        
        <v-card-text>
            <div>
                <ClientOnly>
                    <apexchart 
                        type="area" 
                        height="300" 
                        :options="chartOptions" 
                        :series="chartOptions.series"
                    ></apexchart>
                </ClientOnly>
            </div>
            
            <!-- Legend -->
            <div class="d-flex justify-center align-center mt-4">
                <div class="d-flex align-center">
                    <div class="legend-dot bg-primary mr-2"></div>
                    <span class="text-subtitle-2 text-grey100">
                        {{ selectedMetric === 'questions' ? 'Questions Answered' :
                           selectedMetric === 'studyTime' ? 'Study Time (minutes)' :
                           'Accuracy Rate (%)' }}
                    </span>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}
</style>