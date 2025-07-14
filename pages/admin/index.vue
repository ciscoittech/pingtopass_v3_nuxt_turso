<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Fetch summary stats
const { data: vendorsData } = await useFetch('/api/vendors')
const { data: examsData } = await useFetch('/api/exams')

const stats = computed(() => ({
  vendors: vendorsData.value?.data?.length || 0,
  exams: examsData.value?.data?.length || 0,
  questions: 0, // TODO: Implement questions count
  users: 0 // TODO: Implement users count
}))
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">
        Admin Dashboard
      </h1>
      <p class="text-body-1 text-grey-darken-1">
        Manage your certification exam platform
      </p>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <div class="text-h3 font-weight-bold text-primary">
                  {{ stats.vendors }}
                </div>
                <div class="text-body-2 text-grey-darken-1">
                  Vendors
                </div>
              </div>
              <v-icon size="40" color="primary">mdi-domain</v-icon>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" to="/admin/vendors" size="small">
              Manage
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <div class="text-h3 font-weight-bold text-success">
                  {{ stats.exams }}
                </div>
                <div class="text-body-2 text-grey-darken-1">
                  Exams
                </div>
              </div>
              <v-icon size="40" color="success">mdi-school</v-icon>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" to="/admin/exams" size="small">
              Manage
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <div class="text-h3 font-weight-bold text-warning">
                  {{ stats.questions }}
                </div>
                <div class="text-body-2 text-grey-darken-1">
                  Questions
                </div>
              </div>
              <v-icon size="40" color="warning">mdi-help-circle</v-icon>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" to="/admin/questions" size="small">
              Manage
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <div class="text-h3 font-weight-bold text-info">
                  {{ stats.users }}
                </div>
                <div class="text-body-2 text-grey-darken-1">
                  Users
                </div>
              </div>
              <v-icon size="40" color="info">mdi-account-group</v-icon>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" to="/admin/users" size="small">
              Manage
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                prepend-icon="mdi-plus"
                title="Add New Vendor"
                subtitle="Create a new certification vendor"
                to="/admin/vendors"
              />
              <v-list-item
                prepend-icon="mdi-plus"
                title="Add New Exam"
                subtitle="Create a new certification exam"
                to="/admin/exams"
              />
              <v-list-item
                prepend-icon="mdi-upload"
                title="Import Questions"
                subtitle="Bulk import questions from CSV/JSON"
                to="/admin/questions"
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal">
              Activity tracking will be implemented in a future update
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>