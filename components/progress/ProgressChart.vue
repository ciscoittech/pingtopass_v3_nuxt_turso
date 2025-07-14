<script setup lang="ts">
interface Props {
  chartData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string
      borderColor?: string
      borderWidth?: number
      fill?: boolean
      tension?: number
    }>
  }
  type?: 'line' | 'bar' | 'doughnut' | 'pie'
  height?: string | number
  options?: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  height: 300
})

// Chart.js import and setup
const chartRef = ref<HTMLCanvasElement>()
let chartInstance: any = null

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#1976d2',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: '#666',
        font: {
          size: 12
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: '#666',
        font: {
          size: 12
        }
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: '#1976d2',
      borderColor: '#ffffff',
      borderWidth: 2
    },
    line: {
      tension: 0.4
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
}

const createChart = async () => {
  if (!chartRef.value) return

  // Dynamic import for Chart.js to reduce bundle size
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: props.type,
    data: props.chartData,
    options: {
      ...defaultOptions,
      ...props.options
    }
  })
}

const updateChart = () => {
  if (chartInstance && props.chartData) {
    chartInstance.data = props.chartData
    chartInstance.update('active')
  }
}

// Watch for data changes
watch(() => props.chartData, updateChart, { deep: true })
watch(() => props.type, createChart)

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<template>
  <div class="progress-chart" :style="{ height: typeof height === 'number' ? `${height}px` : height }">
    <canvas ref="chartRef" />
  </div>
</template>

<style scoped>
.progress-chart {
  position: relative;
  width: 100%;
}

.progress-chart canvas {
  max-width: 100%;
  height: 100% !important;
}
</style>