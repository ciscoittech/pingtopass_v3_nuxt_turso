<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { useTheme } from 'vuetify';
// common components
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
// template breadcrumb
const page = ref({ title: 'Radialbar & Radar Chart' });
const breadcrumbs = ref([
    {
        text: 'Dashboard',
        disabled: false,
        href: '#'
    },
    {
        text: 'Radialbar & Radar',
        disabled: true,
        href: '#'
    }
]);

const theme = useTheme();


const radialBarchartOptions = computed(() => {
    return {
        chart: {
            type: 'radialBar',
            height: 300,
            fontFamily: `inherit`,
            foreColor: '#adb0bb',
            toolbar: {
                show: false
            }
        },
        colors: ['rgba(var(--v-theme-info))', 'rgba(var(--v-theme-primary))', 'rgba(var(--v-theme-error))', 'rgba(var(--v-theme-warning ))'],
    
        plotOptions: {
            radialBar: {
                dataLabels: {
                    name: {
                        fontSize: '22px'
                    },
                    value: {
                        fontSize: '16px'
                    },
                    total: {
                        show: true,
                        label: 'Total',
                        formatter() {
                            return 249;
                        }
                    }
                }
            }
        },
    };
});

const radialBarChart = {
    series: [44, 55, 67, 83]
};

const radarOptions = computed(() => {
    return {
        chart: {
            type: 'radar',
            height: 300,
            fontFamily: `inherit`,
             toolbar: {
                    show: false,
                },
        },
        colors: ['rgba(var(--v-theme-primary))'],
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    };
});

const radarChart = {
    series: [
        {
            name: 'Sales',
            data: [80, 50, 30, 40, 100, 20],
        }
    ]
};
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <v-row>
                <v-col cols="12" lg="6">
                    <!-- ---------------------------------------------------- -->
                    <!-- Radialbar Chart -->
                    <!-- ---------------------------------------------------- -->
                    <UiParentCard title="Radialbar Chart">
                        <ClientOnly><apexchart type="radialBar" height="300" :options="radialBarchartOptions" :series="radialBarChart.series">
                        </apexchart></ClientOnly>
                    </UiParentCard>
                </v-col>
                <v-col cols="12" lg="6">
                    <!-- ---------------------------------------------------- -->
                    <!-- Radar Chart -->
                    <!-- ---------------------------------------------------- -->
                    <UiParentCard title="Radar Chart">
                        <ClientOnly><apexchart type="radar" height="300" :options="radarOptions" :series="radarChart.series"> </apexchart></ClientOnly>
                    </UiParentCard>
                </v-col>
            </v-row>
        </v-col>
    </v-row>
</template>
