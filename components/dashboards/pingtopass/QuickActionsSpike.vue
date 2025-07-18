<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Exam {
  id: string;
  name: string;
  code: string;
}

const props = defineProps<{
  exams: Exam[]
}>()
</script>

<template>
  <v-card elevation="10" class="h-100">
    <v-card-text class="pa-3">
      <div class="d-flex justify-space-between align-center mb-3">
        <div class="d-flex align-center">
          <Icon icon="solar:rocket-bold-duotone" size="20" class="text-primary mr-2" />
          <h6 class="text-h6 font-weight-semibold">Quick Start</h6>
        </div>
        <v-chip color="primary" variant="tonal" size="x-small">
          {{ exams.length }} exams
        </v-chip>
      </div>
      
      <v-list class="py-0" density="compact">
        <v-list-item 
          v-for="exam in exams.slice(0, 3)" 
          :key="exam.id"
          :to="`/study/${exam.id}`"
          class="px-2 mb-2 rounded bg-lightsecondary"
          color="primary"
          density="compact"
        >
          <template v-slot:prepend>
            <v-avatar color="primary" variant="tonal" size="32">
              <Icon icon="solar:book-open-linear" width="16" height="16" />
            </v-avatar>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">{{ exam.code }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ exam.name }}</v-list-item-subtitle>
          <template v-slot:append>
            <Icon icon="solar:arrow-right-linear" width="16" height="16" class="text-grey100" />
          </template>
        </v-list-item>
      </v-list>
      
      <v-btn color="primary" variant="tonal" block to="/exams" size="small" class="mt-2">
        <Icon icon="solar:eye-scan-linear" width="16" height="16" class="mr-1" />
        Browse All
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-list-item {
  transition: all 0.2s ease;
}

.v-list-item:hover {
  transform: translateX(4px);
}
</style>