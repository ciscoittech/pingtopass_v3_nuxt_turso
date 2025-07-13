<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// Get user data
const { data: userData } = await useFetch('/api/auth/me');
const user = userData.value?.user;
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">
          Welcome back, {{ user?.fullName || 'Student' }}!
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- Quick Stats -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">0</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Exams Started</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="primary">mdi-book-open-variant</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">0</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Questions Answered</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="success">mdi-help-circle-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">0%</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Average Score</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="warning">mdi-chart-line</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">0</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Study Streak</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="error">mdi-fire</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Quick Actions -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item to="/exams" prepend-icon="mdi-school">
                <v-list-item-title>Browse Certification Exams</v-list-item-title>
                <v-list-item-subtitle>Explore available certifications</v-list-item-subtitle>
              </v-list-item>
              <v-list-item to="/study" prepend-icon="mdi-book-open-page-variant">
                <v-list-item-title>Continue Studying</v-list-item-title>
                <v-list-item-subtitle>Resume your last study session</v-list-item-subtitle>
              </v-list-item>
              <v-list-item to="/test" prepend-icon="mdi-clipboard-text">
                <v-list-item-title>Take a Practice Test</v-list-item-title>
                <v-list-item-subtitle>Test your knowledge</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Activity -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal">
              No recent activity. Start studying to track your progress!
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>