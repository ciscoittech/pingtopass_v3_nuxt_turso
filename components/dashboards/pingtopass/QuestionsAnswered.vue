<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';

const props = defineProps<{
  totalQuestions: number;
  accuracy: number;
}>()

/* Chart */
const chartOptions = computed(() => {
    return {
        series: [props.accuracy, 100 - props.accuracy],
        labels: ["Correct", "Incorrect"],
        chart: {
            height: 170,
            type: "donut",
            fontFamily: `inherit`,
            foreColor: "#adb0bb",
        },
        plotOptions: {
            pie: {
                startAngle: 0,
                endAngle: 360,
                donut: {
                    size: '85%',
                },
            },
        },
        stroke: {
            show: false,
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        colors: ['rgba(var(--v-theme-success))', "#D9D9D9"],
        tooltip: {
            theme: "dark",
            fillSeriesColor: false,
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
                        Questions
                    </h5>
                    <div class="text-subtitle-1 text-grey100 pb-1 font-weight-medium">All time</div>
                </div>
                <div class="text-right">
                    <h4 class="text-h5 mb-1 font-weight-semibold">{{ totalQuestions }}</h4>
                    <v-chip color="success" class="bg-lightsuccess" variant="outlined" size="x-small">
                        {{ accuracy }}% accuracy
                    </v-chip>
                </div>
            </div>
            <div class="my-7">
                <ClientOnly>
                    <apexchart type="donut" class="paymentchart" height="170" :options="chartOptions"
                    :series="chartOptions.series"></apexchart>
                </ClientOnly>
            </div>
            <p class="text-subtitle-1 text-grey100 font-weight-medium text-center pb-1">
                {{ Math.round(totalQuestions * accuracy / 100) }} correct answers
            </p>
        </v-card-text>
    </v-card>
</template>