<template>
  <div class="d-flex mainbox">
    <!-- Main Content Area -->
    <div class="exam-content w-100">
      <!-- Mobile Menu Toggle -->
      <v-btn
        block
        @click="sDrawer = !sDrawer"
        variant="text"
        class="d-lg-none d-md-flex d-sm-flex"
      >
        <v-icon start>mdi-menu</v-icon>
        Filters
      </v-btn>
      <v-divider class="d-lg-none d-block" />
      
      <!-- Main Content Slot -->
      <slot name="content"></slot>
    </div>
  </div>

  <!-- Mobile Filter Drawer -->
  <v-navigation-drawer
    v-model="sDrawer"
    temporary
    class="app_drawer drawer-top-zero"
    width="320"
    v-if="!lgAndUp"
  >
    <perfect-scrollbar class="max-h-100">
      <v-card-text class="pa-0">
        <slot name="mobileFilters"></slot>
      </v-card-text>
    </perfect-scrollbar>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { lgAndUp } = useDisplay()
const sDrawer = ref(false)
</script>

<style lang="scss" scoped>
.mainbox {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 200px);
}

.exam-content {
  width: 100%;
  position: relative;
}

.drawer-top-zero {
  top: 0 !important;
}

.max-h-100 {
  max-height: 100vh;
}
</style>