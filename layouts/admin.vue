<script setup lang="ts">
// Admin layout for management pages
import { ref } from 'vue'

// Check if user is admin
const { data: userData } = await useFetch('/api/auth/me')
if (!userData.value?.user?.isAdmin) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Admin access required'
  })
}

const user = userData.value.user
const drawer = ref(true)

// Navigation items
const adminNavItems = [
  {
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    to: '/admin'
  },
  {
    title: 'Vendors',
    icon: 'mdi-domain',
    to: '/admin/vendors'
  },
  {
    title: 'Exams',
    icon: 'mdi-school',
    to: '/admin/exams'
  },
  {
    title: 'Questions',
    icon: 'mdi-help-circle',
    to: '/admin/questions'
  },
  {
    title: 'Users',
    icon: 'mdi-account-group',
    to: '/admin/users'
  },
  {
    title: 'Analytics',
    icon: 'mdi-chart-line',
    to: '/admin/analytics'
  }
]

// Logout function
const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/')
}
</script>

<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
      color="primary"
      dark
      width="280"
    >
      <!-- App Logo/Title -->
      <div class="pa-4">
        <h2 class="text-h5 font-weight-bold">
          PingToPass Admin
        </h2>
      </div>

      <v-divider></v-divider>

      <!-- Navigation Menu -->
      <v-list nav>
        <v-list-item
          v-for="item in adminNavItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="xl"
          class="ma-2"
        />
      </v-list>

      <template v-slot:append>
        <v-divider></v-divider>
        
        <!-- User Info -->
        <v-list>
          <v-list-item class="pa-4">
            <template v-slot:prepend>
              <v-avatar color="secondary">
                <span class="text-h6">{{ user.fullName?.charAt(0) || 'A' }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">
              {{ user.fullName || 'Admin' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ user.email }}
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item
            @click="logout"
            prepend-icon="mdi-logout"
            title="Logout"
            class="mx-2"
            rounded="xl"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar
      app
      color="white"
      flat
      border
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      
      <v-toolbar-title class="font-weight-bold">
        Admin Panel
      </v-toolbar-title>

      <v-spacer />

      <!-- Quick Actions -->
      <v-btn
        icon="mdi-home"
        variant="text"
        to="/dashboard"
        title="Back to App"
      />
      
      <v-btn
        icon="mdi-help-circle"
        variant="text"
        title="Help"
      />
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <NuxtPage />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.v-navigation-drawer {
  border-right: none !important;
}
</style>