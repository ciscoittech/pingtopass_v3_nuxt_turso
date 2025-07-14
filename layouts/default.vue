<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify'
import { useCustomizerStore } from '@/stores/customizer'

const { lgAndUp } = useDisplay()
const theme = useTheme()
const customizer = useCustomizerStore()

// Initialize sidebar state and theme on mount
onMounted(() => {
  // Set theme from store after ensuring Vuetify is ready
  if (theme.global?.name) {
    theme.global.name.value = customizer.actTheme
  }
  
  if (customizer.Sidebar_drawer === null) {
    customizer.SET_SIDEBAR_DRAWER()
  }
})

// Reactive properties
const sDrawer = computed({
  get() {
    return customizer.Sidebar_drawer
  },
  set(val: boolean) {
    customizer.SET_SIDEBAR_DRAWER()
  }
})

const showCustomizer = computed({
  get() {
    return customizer.Customizer_drawer
  },
  set(val: boolean) {
    customizer.SET_CUSTOMIZER_DRAWER(val)
  }
})

const mini = computed(() => customizer.mini_sidebar)

function miniSidebar() {
  customizer.SET_MINI_SIDEBAR(!customizer.mini_sidebar)
}

// Watch for theme changes
watch(() => customizer.actTheme, (val) => {
  if (theme.global?.name) {
    theme.global.name.value = val
  }
})
</script>

<template>
  <v-app>
    <!-- VerticalSidebar -->
    <LcFullVerticalSidebar 
      v-model="sDrawer" 
      :mini-variant="mini" 
      :expand-on-hover="mini"
    />
    
    <!-- Header -->
    <LcFullVerticalHeader 
      @sDrawerToggle="sDrawer = !sDrawer" 
      @miniSidebar="miniSidebar" 
    />
    
    <!-- Main Content -->
    <v-main>
      <v-container fluid class="page-wrapper">
        <div class="maxWidth">
          <slot />
        </div>
      </v-container>
    </v-main>
    
    <!-- Customizer -->
    <v-navigation-drawer 
      v-model="showCustomizer" 
      location="right" 
      temporary 
      width="350" 
      app
    >
      <LcFullCustomizer />
    </v-navigation-drawer>
    
    <!-- Chat Widget -->
    <ChatWidget />
  </v-app>
</template>

<style lang="scss">
.v-app {
  background: rgb(var(--v-theme-background)) !important;
}

.page-wrapper {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.maxWidth {
  max-width: 1400px;
  margin: 0 auto;
}

// Responsive adjustments
@media (max-width: 960px) {
  .page-wrapper {
    padding: 16px;
  }
}
</style>