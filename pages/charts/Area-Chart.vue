<script setup lang="ts">
import { computed } from "vue";

import { useTheme } from "vuetify";

// Vuetify theme
const theme = useTheme();

import { ref } from "vue";
// common components
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import UiParentCard from "@/components/shared/UiParentCard.vue";
// theme breadcrumb
const page = ref({ title: "Area Chart" });
const breadcrumbs = ref([
  {
    text: "Dashboard",
    disabled: false,
    href: "/",
  },
  {
    text: "Area Chart",
    disabled: true,
    href: "#",
  },
]);

const chartOptions = computed(() => {
  const primaryColor = theme.current.value.colors.primary;
  const secondaryColor = theme.current.value.colors.secondary;
  return {
    chart: {
      type: "area",
      height: 300,
      fontFamily: `inherit`,
      foreColor: "#adb0bb",
      zoom: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
    },
    colors: [primaryColor, secondaryColor],

    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: "3",
      curve: "smooth",
    },
    xaxis: {
      type: "datetime",
      categories: [
        "2018-09-19T00:00:00",
        "2018-09-19T01:30:00",
        "2018-09-19T02:30:00",
        "2018-09-19T03:30:00",
        "2018-09-19T04:30:00",
        "2018-09-19T05:30:00",
        "2018-09-19T06:30:00",
      ],
    },

    yaxis: {
      opposite: false,
      labels: {
        show: true,
      },
    },
    legend: {
      show: true,
      position: "bottom",
      width: "50px",
    },
    grid: {
      show: false,
    },
    tooltip: {
      theme: "dark",
    },
  };
});

const areaChart = {
  series: [
    {
      name: "Sales Summery 1",
      data: [31, 40, 28, 51, 42, 109, 100],
    },
    {
      name: "Sales Summery 2",
      data: [11, 32, 45, 32, 34, 52, 41],
    },
  ],
};
</script>

<template>
  <!-- ---------------------------------------------------- -->
  <!-- Area Chart -->
  <!-- ---------------------------------------------------- -->
  <BaseBreadcrumb
    :title="page.title"
    :breadcrumbs="breadcrumbs"
  ></BaseBreadcrumb>
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Area Chart">
        <ClientOnly
          ><apexchart
            type="area"
            height="300"
            :options="chartOptions"
            :series="areaChart.series"
          >
          </apexchart
        ></ClientOnly>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
