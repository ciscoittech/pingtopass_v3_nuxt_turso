<template>
  <div class="study-loading-state">
    <!-- Header Skeleton -->
    <v-row class="mb-4">
      <v-col cols="12">
        <SafeSkeletonLoader
          :type="'heading'"
          class="mb-2"
        />
        <SafeSkeletonLoader
          :type="'subtitle'"
          style="width: 60%"
        />
      </v-col>
    </v-row>

    <!-- Progress Bar Skeleton -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-text>
            <SafeSkeletonLoader
              :type="'text'"
              class="mb-2"
            />
            <SafeSkeletonLoader
              :type="'linear-progress'"
              height="24"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Question Card Skeleton -->
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="3">
          <v-card-text class="pa-6">
            <!-- Question Number -->
            <SafeSkeletonLoader
              :type="'chip'"
              width="120"
              class="mb-4"
            />
            
            <!-- Question Text -->
            <SafeSkeletonLoader
              :type="'paragraph'"
              class="mb-4"
            />
            
            <!-- Code Block (optional) -->
            <SafeSkeletonLoader
              v-if="showCodeBlock"
              :type="'card'"
              height="120"
              class="mb-4"
            />
            
            <!-- Options -->
            <div v-for="i in 4" :key="i" class="mb-3">
              <SafeSkeletonLoader
                :type="'button'"
                height="56"
                width="100%"
              />
            </div>
            
            <!-- Action Buttons -->
            <v-row class="mt-6">
              <v-col cols="6">
                <SafeSkeletonLoader
                  :type="'button'"
                  height="48"
                />
              </v-col>
              <v-col cols="6">
                <SafeSkeletonLoader
                  :type="'button'"
                  height="48"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading Message -->
    <v-row v-if="message" class="mt-4">
      <v-col cols="12" class="text-center">
        <v-fade-transition>
          <div class="text-subtitle-1 text-medium-emphasis">
            {{ message }}
          </div>
        </v-fade-transition>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import SafeSkeletonLoader from '@/components/shared/SafeSkeletonLoader.vue'

interface Props {
  message?: string
  showCodeBlock?: boolean
}

withDefaults(defineProps<Props>(), {
  message: '',
  showCodeBlock: false
})
</script>

<style scoped>
.study-loading-state {
  animation: pulse-opacity 2s ease-in-out infinite;
}

@keyframes pulse-opacity {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>