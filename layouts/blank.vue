<script setup lang="ts">
// Blank layout for authentication pages
import { onMounted } from 'vue'

// Ensure proper mounting
onMounted(() => {
  console.log('Blank layout mounted')
})
</script>

<template>
  <v-app class="authpage">
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<style lang="scss">
.authpage {
  background: rgb(var(--v-theme-background)) !important;
  min-height: 100vh;
}
</style>

