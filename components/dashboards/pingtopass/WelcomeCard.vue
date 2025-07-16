<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  userName: string;
  totalExams: number;
  completedExams: number;
  studyStreak: number;
  studyHours: number;
}

const props = withDefaults(defineProps<Props>(), {
  userName: 'Student',
  totalExams: 0,
  completedExams: 0,
  studyStreak: 0,
  studyHours: 0
});

// Compute progress percentage
const progressPercentage = computed(() => {
  if (props.totalExams === 0) return 0;
  return Math.round((props.completedExams / props.totalExams) * 100);
});

// Format study hours
const formattedHours = computed(() => {
  const hours = Math.floor(props.studyHours / 3600);
  const minutes = Math.floor((props.studyHours % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

/* Chart */
const chartOptions = computed(() => {
    return {
        series: [
            {
                name: "Study Time",
                data: [30, 45, 60, 75, 90, 105, 120] // Study minutes per day
            },
            {
                name: "Questions",
                data: [20, 35, 40, 55, 70, 85, 95] // Questions answered per day
            },
        ],
      
        chart: {
            type: "line",
            fontFamily: `inherit`,
            foreColor: "#adb0bb",
            width: "100%",
            height: 260,
            toolbar: {
                show: false,
            },
            stacked: false
        },

        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            floating: true,
            offsetY: -25,
            offsetX: -5
        },
        stroke: {
            width: 3,
            curve: "smooth",  
        },
        grid: {
            borderColor: 'rgba(var(--v-theme-borderColor))',
           
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                },

            },
            padding: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
        },
        colors: ['rgba(var(--v-theme-primary))', 'rgba(var(--v-theme-success))'],
       
        
        markers: {
            size: 0,
        },
        tooltip: {
            theme: "dark",
        },
        xaxis: {
            labels: {
                show: true,
                style: {
                    colors: 'rgba(var(--v-theme-grey100))',
                }
            },
            type: 'category',
            categories: [
                "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
            ],
            axisTicks: {
                show: false,
            },
            axisBorder: {
                show: false,
            },

        },
        yaxis: {
            axisTicks: {
                show: false,
            },
            axisBorder: {
                show: false,
            },
            labels: {
                style: {
                    colors: 'rgba(var(--v-theme-grey100))',
                }
            }
        }
    };
});
</script>

<template>
    <v-card elevation="10">
        <v-card-text class="position-relative pb-0 border-bottom">
            <h5 class="text-h4 mb-1 font-weight-semibold">
                Welcome back, {{ userName }}!
            </h5>
            <div class="text-subtitle-1 text-grey100 pb-1 font-weight-medium">
                You've completed {{ progressPercentage }}% of your certification journey
            </div>
            <div class="mt-6 d-sm-flex d-block">
                <ul class="list-unstyled mb-0">
                    <li class="d-flex align-center mb-5">
                        <v-avatar
                            class="bg-lightsuccess p-7 me-4 rounded-circle d-flex align-items-center justify-content-center"
                            size="48">
                            <Icon icon="solar:book-2-linear" height="24" width="24" class="text-success"/>
                        </v-avatar>
                        <div>
                            <h6 class="mb-1 text-h6 font-weight-semibold">{{ totalExams }} exams</h6>
                            <p class="text-subtitle-1 text-grey100 font-weight-medium">Available to study</p>
                        </div>
                    </li>
                    <li class="d-flex align-center mb-5">
                        <v-avatar
                            class="bg-lightwarning p-7 me-4 rounded-circle d-flex align-items-center justify-content-center"
                            size="48">
                            <Icon icon="solar:fire-linear" height="24" width="24" class="text-warning"/>
                        </v-avatar>
                        <div>
                            <h6 class="mb-1 text-h6 font-weight-semibold">{{ studyStreak }} days</h6>
                            <p class="text-subtitle-1 text-grey100 font-weight-medium">Current streak</p>
                        </div>
                    </li>
                    <li class="d-flex align-center mb-5">
                        <v-avatar
                            class="bg-lightinfo p-7 me-4 rounded-circle d-flex align-items-center justify-content-center"
                            size="48">
                            <Icon icon="solar:clock-circle-linear" height="24" width="24" class="text-info"/>
                        </v-avatar>
                        <div>
                            <h6 class="mb-1 text-h6 font-weight-semibold">{{ formattedHours }}</h6>
                            <p class="text-subtitle-1 text-grey100 font-weight-medium">Study time today</p>
                        </div>
                    </li>
                </ul>
                <div class="study-illustration ml-auto mb-n1 mr-n8">
                    <v-img
                        :src="'/images/backgrounds/man-working-on-laptop.png'"
                        class="w-100"
                        alt="Study Illustration"
                        max-width="180"
                    />
                </div>
            </div>
        </v-card-text>
        <v-card-text class="position-relative">
            <div class="d-sm-flex justify-space-between d-block align-center">
                <div>
                    <h5 class="text-h4 mb-1 font-weight-semibold">
                        Weekly Activity
                    </h5>
                    <div class="text-subtitle-1 text-grey100 pb-1 font-weight-medium">Your study progress this week</div>
                </div>
                <div class="my-sm-0 my-3">
                    <v-chip color="primary" variant="tonal" size="small">
                        <Icon icon="solar:chart-linear" class="mr-1" size="16" />
                        This Week
                    </v-chip>
                </div>
            </div>
            <div>
                <ClientOnly>
                    <apexchart type="line" height="260" :options="chartOptions" :series="chartOptions.series"></apexchart>
                </ClientOnly>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.study-illustration {
    max-width: 180px;
    display: flex;
    align-items: flex-end;
}
</style>