<script setup lang="ts">
definePageMeta({
  layout: "blank",
});

// Auth check handled by middleware
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <v-container class="py-16">
      <v-row align="center" justify="center">
        <v-col cols="12" md="8" class="text-center">
          <h1 class="text-h2 font-weight-bold mb-4">
            Pass Your IT Certification Exams
          </h1>
          <p class="text-h6 text-grey-darken-1 mb-8">
            Comprehensive study materials, practice tests, and progress tracking for CompTIA, Cisco, Microsoft, and more.
          </p>
          <v-btn
            size="x-large"
            color="primary"
            rounded="pill"
            to="/auth/login"
            class="px-8"
          >
            Get Started Free
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Features Section -->
    <v-container class="py-16 bg-grey-lighten-5">
      <v-row>
        <v-col cols="12" class="text-center mb-8">
          <h2 class="text-h3 font-weight-bold">Everything You Need to Pass</h2>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="text-center pa-6" elevation="0">
            <v-icon size="64" color="primary" class="mb-4">mdi-book-open-variant</v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">Study Mode</h3>
            <p class="text-body-1 text-grey-darken-1">
              Practice questions with instant feedback and detailed explanations
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="text-center pa-6" elevation="0">
            <v-icon size="64" color="primary" class="mb-4">mdi-clipboard-text</v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">Practice Tests</h3>
            <p class="text-body-1 text-grey-darken-1">
              Timed exams that simulate the real certification experience
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="text-center pa-6" elevation="0">
            <v-icon size="64" color="primary" class="mb-4">mdi-chart-line</v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">Progress Tracking</h3>
            <p class="text-body-1 text-grey-darken-1">
              Monitor your improvement and identify areas for focus
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- CTA Section -->
    <v-container class="py-16 text-center">
      <v-row justify="center">
        <v-col cols="12" md="6">
          <h2 class="text-h3 font-weight-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p class="text-h6 text-grey-darken-1 mb-8">
            Join thousands of IT professionals who have passed their exams with PingToPass
          </p>
          <v-btn
            size="large"
            color="primary"
            rounded="pill"
            to="/auth/login"
          >
            Sign Up Now - It's Free
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
}
</style>