<template>
  <div class="lazy-chart-container">
    <ClientOnly>
      <component
        v-if="chartComponent"
        :is="chartComponent"
        v-bind="$attrs"
      />
      <div v-else class="d-flex justify-center align-center" style="min-height: 300px;">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <template #fallback>
        <div class="d-flex justify-center align-center" style="min-height: 300px;">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { createLazyComponent } from '~/utils/dynamic-imports'

// Only load ApexCharts when component is actually used
const chartComponent = ref(null)

// Load chart component when visible
const loadChart = async () => {
  if (!chartComponent.value) {
    chartComponent.value = await createLazyComponent(
      () => import('vue3-apexcharts')
    )
  }
}

// Use Intersection Observer to load when visible
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadChart()
        observer.disconnect()
      }
    },
    { threshold: 0.1 }
  )

  const container = document.querySelector('.lazy-chart-container')
  if (container) {
    observer.observe(container)
  }

  // Cleanup
  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>

<style scoped>
.lazy-chart-container {
  min-height: 300px;
  position: relative;
}
</style>