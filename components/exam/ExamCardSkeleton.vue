<template>
  <v-card elevation="10" class="exam-card-skeleton h-100">
    <v-card-item>
      <div class="d-flex align-center justify-space-between">
        <div class="flex-grow-1">
          <SkeletonLoader type="text" width="120px" height="20px" class="mb-2" />
          <SkeletonLoader type="text" width="200px" height="16px" />
        </div>
        <SkeletonLoader type="avatar" width="48px" height="48px" />
      </div>
    </v-card-item>

    <v-card-text>
      <SkeletonLoader type="text" width="100%" height="14px" class="mb-2" />
      <SkeletonLoader type="text" width="80%" height="14px" class="mb-4" />
      
      <div class="mb-4">
        <SkeletonLoader type="text" width="100%" height="8px" rounded="rounded" />
      </div>

      <v-row dense>
        <v-col cols="4">
          <SkeletonLoader type="text" width="100%" height="40px" rounded="rounded-md" />
        </v-col>
        <v-col cols="4">
          <SkeletonLoader type="text" width="100%" height="40px" rounded="rounded-md" />
        </v-col>
        <v-col cols="4">
          <SkeletonLoader type="text" width="100%" height="40px" rounded="rounded-md" />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions>
      <SkeletonLoader type="button" width="100%" height="36px" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import SkeletonLoader from '@/components/shared/SkeletonLoader.vue'
</script>

<style scoped>
.exam-card-skeleton {
  min-height: 320px;
}
</style>