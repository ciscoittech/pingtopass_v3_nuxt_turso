<script setup lang="ts">
// Minimal layout to debug initialization error
const title = ref("PingToPass - IT Certification Exam Platform");

useHead({
  title: title.value,
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} - PingToPass`
      : "PingToPass - IT Certification Exam Platform";
  },
});
</script>

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <NuxtPage />
      </v-container>
    </v-main>
  </v-app>
</template>
