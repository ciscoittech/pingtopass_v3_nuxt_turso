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
    <v-card-text class="position-relative">
      <div class="d-flex justify-space-between d-block">
        <div>
          <h5 class="text-h5 mb-1 font-weight-semibold">
            Quick Actions
          </h5>
          <div class="text-subtitle-1 text-grey100 pb-1 font-weight-medium">Jump into study mode</div>
        </div>
        <div class="mt-1 text-right">
          <v-chip color="primary" class="bg-lightprimary" variant="outlined" size="x-small">
            {{ exams.length }} exams
          </v-chip>
        </div>
      </div>
      
      <div class="my-sm-14 my-8">
        <v-list class="py-0">
          <v-list-item 
            v-for="exam in exams.slice(0, 3)" 
            :key="exam.id"
            :to="`/study/${exam.id}`"
            class="px-2 mb-3 rounded-lg bg-lightsecondary"
            color="primary"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal" size="40">
                <Icon icon="solar:book-open-linear" width="20" height="20" />
              </v-avatar>
            </template>
            <v-list-item-title class="text-h6 font-weight-medium">{{ exam.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-subtitle-2">{{ exam.code }}</v-list-item-subtitle>
            <template v-slot:append>
              <Icon icon="solar:arrow-right-linear" width="20" height="20" class="text-grey100" />
            </template>
          </v-list-item>
        </v-list>
      </div>
      
      <div class="pb-md-2">
        <v-btn color="primary" variant="flat" block to="/exams" size="large">
          <Icon icon="solar:eye-scan-linear" width="20" height="20" class="mr-2" />
          Browse All Exams
        </v-btn>
      </div>
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