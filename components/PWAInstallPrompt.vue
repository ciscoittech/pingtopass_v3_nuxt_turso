<script setup lang="ts">
const showInstallPrompt = ref(false)
const deferredPrompt = ref<any>(null)
const isIOS = ref(false)
const isInStandaloneMode = ref(false)

onMounted(() => {
  // Check if running in standalone mode (already installed)
  isInStandaloneMode.value = window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true

  // Check if iOS
  isIOS.value = /iPad|iPhone|iPod/.test(navigator.userAgent)

  // Listen for beforeinstallprompt event (Android/Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    
    // Show install prompt after a delay if not already installed
    if (!isInStandaloneMode.value) {
      setTimeout(() => {
        showInstallPrompt.value = true
      }, 3000)
    }
  })

  // For iOS devices, show manual install instructions
  if (isIOS.value && !isInStandaloneMode.value) {
    setTimeout(() => {
      showInstallPrompt.value = true
    }, 5000)
  }
})

const installApp = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA installed')
    }
    
    deferredPrompt.value = null
  }
  
  showInstallPrompt.value = false
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  
  // Remember dismissal for 24 hours
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}

// Check if user dismissed recently
onMounted(() => {
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed) {
    const dismissedTime = parseInt(dismissed)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    
    if (dismissedTime > oneDayAgo) {
      showInstallPrompt.value = false
      return
    }
  }
})
</script>

<template>
  <v-snackbar
    v-model="showInstallPrompt"
    location="bottom"
    :timeout="-1"
    color="primary"
    class="pwa-install-banner"
  >
    <template #text>
      <div class="d-flex align-center">
        <v-icon class="mr-3" size="24">mdi-download</v-icon>
        <div>
          <div class="text-subtitle-2 font-weight-bold">Install PingToPass</div>
          <div class="text-caption">
            <span v-if="!isIOS">Add to your home screen for faster access</span>
            <span v-else>Tap Share → Add to Home Screen</span>
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <v-btn
        v-if="!isIOS && deferredPrompt"
        variant="text"
        color="white"
        @click="installApp"
      >
        Install
      </v-btn>
      
      <v-btn
        variant="text"
        color="white"
        @click="dismissPrompt"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>

  <!-- iOS Installation Instructions Modal -->
  <v-dialog
    v-if="isIOS"
    v-model="showInstallPrompt"
    max-width="400px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-apple</v-icon>
        Install PingToPass
      </v-card-title>
      
      <v-card-text>
        <div class="install-steps">
          <p class="text-body-1 mb-4">
            Install PingToPass on your iPhone or iPad for the best experience:
          </p>
          
          <div class="step mb-3">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-share</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Step 1</span>
            </div>
            <p class="text-body-2 ml-8">
              Tap the Share button at the bottom of your browser
            </p>
          </div>
          
          <div class="step mb-3">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-plus-box</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Step 2</span>
            </div>
            <p class="text-body-2 ml-8">
              Scroll down and tap "Add to Home Screen"
            </p>
          </div>
          
          <div class="step">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-check</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Step 3</span>
            </div>
            <p class="text-body-2 ml-8">
              Tap "Add" to install PingToPass
            </p>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dismissPrompt">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pwa-install-banner {
  max-width: 100%;
}

.install-steps {
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  padding: 16px;
}

.step {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 16px;
  margin-left: 12px;
}

@media (min-width: 768px) {
  .pwa-install-banner {
    max-width: 400px;
    margin: 0 24px 24px auto;
  }
}
</style>