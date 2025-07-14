<template>
  <v-app>
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup>
// Minimal layout for test mode - no navigation or sidebar
</script>

<style scoped>
.v-main {
  min-height: 100vh;
}
</style>