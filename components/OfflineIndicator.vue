<script setup lang="ts">
const isOnline = ref(true)
const showOfflineMessage = ref(false)

onMounted(() => {
  // Set initial state
  isOnline.value = navigator.onLine

  // Listen for online/offline events
  const handleOnline = () => {
    isOnline.value = true
    showOfflineMessage.value = false
  }

  const handleOffline = () => {
    isOnline.value = false
    showOfflineMessage.value = true
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
})

const dismissOfflineMessage = () => {
  showOfflineMessage.value = false
}
</script>

<template>
  <!-- Persistent connection status indicator -->
  <div
    v-if="!isOnline"
    class="offline-indicator"
  >
    <v-icon size="16" class="mr-1">mdi-wifi-off</v-icon>
    <span class="text-caption">Offline</span>
  </div>

  <!-- Offline notification banner -->
  <v-snackbar
    v-model="showOfflineMessage"
    location="top"
    color="warning"
    timeout="10000"
    class="offline-banner"
  >
    <template #text>
      <div class="d-flex align-center">
        <v-icon class="mr-3">mdi-wifi-off</v-icon>
        <div>
          <div class="text-subtitle-2 font-weight-bold">You're offline</div>
          <div class="text-caption">
            Some features may not work. Check your internet connection.
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <v-btn
        variant="text"
        color="white"
        @click="dismissOfflineMessage"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>

  <!-- Back online notification -->
  <v-snackbar
    v-model="isOnline"
    location="top"
    color="success"
    timeout="3000"
    v-if="isOnline && !showOfflineMessage"
  >
    <template #text>
      <div class="d-flex align-center">
        <v-icon class="mr-3">mdi-wifi</v-icon>
        <div>
          <div class="text-subtitle-2 font-weight-bold">Back online</div>
          <div class="text-caption">
            All features are now available.
          </div>
        </div>
      </div>
    </template>
  </v-snackbar>
</template>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 16px;
  left: 16px;
  background: rgba(255, 152, 0, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  z-index: 1001;
  display: flex;
  align-items: center;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.offline-banner {
  z-index: 1002;
}

@media (min-width: 768px) {
  .offline-indicator {
    top: 24px;
    left: 24px;
  }
}
</style>