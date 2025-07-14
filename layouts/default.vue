<script setup lang="ts">
import { useDisplay } from 'vuetify'
const { lgAndUp } = useDisplay()

const customizer = ref(false)
const mini = ref(false)
const drawerWidth = ref(270)
const sDrawer = ref(true)

function miniSidebar() {
  mini.value = !mini.value
}
</script>

<template>
  <v-layout>
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
      v-model="customizer" 
      location="right" 
      temporary 
      width="350" 
      app
    >
      <LcFullCustomizerCustomizer />
    </v-navigation-drawer>
  </v-layout>
</template>

<style lang="scss">
.page-wrapper {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: rgb(var(--v-theme-surface));
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