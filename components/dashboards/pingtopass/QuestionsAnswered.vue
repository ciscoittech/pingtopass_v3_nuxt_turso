<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  totalQuestions: number;
  accuracy: number;
}>()

// Format large numbers
const formatNumber = (num: number) => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

/* Chart */
const chartOptions = computed(() => {
    return {
        series: [props.accuracy],
        chart: {
            height: 80,
            type: "radialBar",
            fontFamily: `inherit`,
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    size: '60%',
                },
                dataLabels: {
                    name: {
                        show: false
                    },
                    value: {
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'rgba(var(--v-theme-success))',
                        formatter: function (val: any) {
                            return val + "%"
                        }
                    }
                }
            }
        },
        colors: ['rgba(var(--v-theme-success))'],
        stroke: {
            lineCap: 'round'
        },
    };
});
</script>

<template>
    <v-card elevation="10" class="h-100">
        <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-center mb-2">
                <div class="d-flex align-center">
                    <Icon icon="solar:question-circle-bold-duotone" size="20" class="text-primary mr-2" />
                    <h6 class="text-h6 font-weight-semibold">{{ formatNumber(totalQuestions) }} Questions</h6>
                </div>
                <v-chip color="success" variant="tonal" size="x-small">
                    All time
                </v-chip>
            </div>
            <div class="d-flex align-center">
                <div class="flex-grow-1">
                    <ClientOnly>
                        <apexchart type="radialBar" height="80" :options="chartOptions"
                        :series="chartOptions.series"></apexchart>
                    </ClientOnly>
                </div>
                <div class="text-center ml-2">
                    <p class="text-caption text-grey100 mb-1">Accuracy</p>
                    <h5 class="text-h5 font-weight-bold text-success">{{ accuracy }}%</h5>
                </div>
            </div>
            <p class="text-caption text-grey100 mb-0 text-center">
                {{ formatNumber(Math.round(totalQuestions * accuracy / 100)) }} correct answers
            </p>
        </v-card-text>
    </v-card>
</template>