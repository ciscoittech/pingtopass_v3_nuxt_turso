<script setup lang="ts">
import { useCustomizerStore } from '@/stores/customizer';
import { computed } from 'vue';

const customizer = useCustomizerStore();

const isDark = computed(() => {
  return customizer.actTheme?.includes('DARK');
});
</script>

<template>
  <div class="logo d-flex align-center">
    <NuxtLink to="/dashboard" class="d-flex align-center text-decoration-none">
      <v-icon icon="mdi-certificate" size="32" :color="isDark ? 'primary' : 'primary'" />
      <span class="ml-3 text-h5 font-weight-bold" :class="isDark ? 'text-white' : 'text-primary'">
        PingToPass
      </span>
    </NuxtLink>
  </div>
</template>

<style scoped>
.logo {
  padding: 4px 0;
}
</style>