<script setup lang="ts">
import { Icon } from '@iconify/vue';
import shape1 from '/images/svgs/warning-shap.svg';
import shape2 from '/images/svgs/danger-shap.svg';
import shape3 from '/images/svgs/info-shap.svg';

const props = defineProps<{
  stats: {
    studyStreak: number;
    totalStudyTime: number;
    averageAccuracy: number;
    questionsAnswered: number;
  }
}>()

// Format time helper
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const cards = computed(() => [
  {
    icon: 'fire-linear',
    num: props.stats.studyStreak || 0,
    percent: props.stats.studyStreak > 0 ? 'days' : 'day',
    title: "Study Streak",
    shape: shape1,
    color: 'primary'
  },
  {
    icon: 'clock-circle-line-duotone',
    num: formatTime(props.stats.totalStudyTime || 0),
    percent: '',
    title: "Total Study Time",
    shape: shape2,
    color: 'success'
  },
  {
    icon: 'target-line-duotone',
    num: `${Math.round(props.stats.averageAccuracy || 0)}%`,
    percent: '',
    title: "Average Accuracy",
    shape: shape3,
    color: 'info'
  },
  {
    icon: 'document-text-line-duotone',
    num: props.stats.questionsAnswered || 0,
    percent: 'answered',
    title: "Questions",
    shape: shape1,
    color: 'warning'
  }
])
</script>

<template>
  <v-row class="d-flex">
    <v-col v-for="(item, index) in cards" :key="item.title" cols="12" sm="6" lg="3" class="d-flex">
      <v-card elevation="10" :color="item.color" class="w-100">
        <v-card-text class="pl-5 pr-7">
          <img :src="item.shape" alt="shape" class="shape">
          <Icon :icon="'solar:' + item.icon" width="30" height="30" class="mb-6"/>
          <h5 class="text-h4 font-weight-semibold mb-2 text-white">
            {{ item.num }}<span class="text-subtitle-2 pl-1">{{ item.percent }}</span>
          </h5>
          <p class="text-subtitle-1 opacity-50 font-weight-medium">{{ item.title }}</p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.shape {
  position: absolute;
  right: 0;
  top: 0px;
}
</style>