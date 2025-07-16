<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify'
import { useCustomizerStore } from '@/stores/customizer'

// Admin layout - uses the same theme as default layout
// Check if user is admin
const { data: userData } = await useFetch('/api/auth/me')
if (!userData.value?.user?.isAdmin) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Admin access required'
  })
}

const { lgAndUp } = useDisplay()
const theme = useTheme()
const customizer = useCustomizerStore()

// Set theme from store after mount
onMounted(() => {
  if (theme.global?.name) {
    theme.global.name.value = customizer.actTheme
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
  <v-app
    :class="[
      'verticalLayout',
      customizer.mini_sidebar ? 'mini-sidebar' : '',
    ]"
  >
    <!-- VerticalSidebar -->
    <LcFullVerticalSidebar 
      v-model="sDrawer" 
      :mini-variant="mini" 
      :expand-on-hover="mini"
    />
    
    <!-- Header with wrapper -->
    <div :class="customizer.boxed ? 'maxWidth' : 'full-header'">
      <LcFullVerticalHeader 
        @sDrawerToggle="sDrawer = !sDrawer" 
        @miniSidebar="miniSidebar" 
      />
    </div>
    
    <!-- Main Content -->
    <v-main>
      <v-container fluid class="page-wrapper px-sm-5 px-4 pt-12 rounded-xl">
        <div :class="customizer.boxed ? 'maxWidth' : ''">
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
    
    <!-- Chat Widget (Admin version) -->
    <ChatWidget />
  </v-app>
</template>

<style lang="scss">
// Admin layout specific styles (if needed)
// Most styles are inherited from the theme
</style>