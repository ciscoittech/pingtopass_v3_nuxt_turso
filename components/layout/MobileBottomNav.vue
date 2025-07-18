<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useActiveSession } from '~/composables/useActiveSession'

const route = useRoute()
const { lastActivity, activeStudySessions, activeTestSessions } = useActiveSession()

// Dynamic navigation items based on active sessions
const navItems = computed(() => {
  const items = [
    {
      title: 'Dashboard',
      icon: 'solar:home-2-bold-duotone',
      to: '/dashboard',
      activeIcon: 'solar:home-2-bold'
    },
    {
      title: 'Exams',
      icon: 'solar:book-open-bold-duotone',
      to: '/exams',
      activeIcon: 'solar:book-open-bold'
    }
  ]
  
  // Dynamic middle button based on active sessions
  if (lastActivity.value) {
    // Continue last activity
    items.push({
      title: 'Continue',
      icon: lastActivity.value.mode === 'study' ? 'solar:play-circle-bold-duotone' : 'solar:timer-start-bold-duotone',
      to: `/${lastActivity.value.mode}/${lastActivity.value.examId}`,
      activeIcon: lastActivity.value.mode === 'study' ? 'solar:play-circle-bold' : 'solar:timer-start-bold',
      action: 'continue',
      badge: lastActivity.value.examCode
    })
  } else if (activeStudySessions.value.length > 0) {
    // Resume study
    const recentStudy = activeStudySessions.value[0]
    items.push({
      title: 'Study',
      icon: 'solar:book-2-bold-duotone',
      to: `/study/${recentStudy.examId}`,
      activeIcon: 'solar:book-2-bold',
      action: 'study',
      badge: recentStudy.examCode
    })
  } else {
    // Default quick start
    items.push({
      title: 'Start',
      icon: 'solar:play-circle-bold-duotone',
      to: '/exams',
      activeIcon: 'solar:play-circle-bold',
      action: 'quickStart'
    })
  }
  
  // Complete with remaining items
  items.push(
    {
      title: 'Leaderboard',
      icon: 'solar:trophy-bold-duotone',
      to: '/leaderboard',
      activeIcon: 'solar:trophy-bold'
    },
    {
      title: 'Profile',
      icon: 'solar:user-circle-bold-duotone',
      to: '/profile',
      activeIcon: 'solar:user-circle-bold'
    }
  )
  
  return items
})

// Check if current route matches nav item
const isActive = (item: any) => {
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

// Handle quick start action
const handleQuickStart = async () => {
  // Get last studied exam from localStorage
  const lastExam = localStorage.getItem('lastStudiedExam')
  if (lastExam) {
    try {
      const exam = JSON.parse(lastExam)
      await navigateTo(`/study/${exam.examId}`)
    } catch (e) {
      await navigateTo('/exams')
    }
  } else {
    await navigateTo('/exams')
  }
}

// Handle navigation
const handleNavigation = (item: any) => {
  if (item.action === 'quickStart') {
    handleQuickStart()
  } else {
    navigateTo(item.to)
  }
}
</script>

<template>
  <v-bottom-navigation
    :elevation="8"
    height="56"
    class="mobile-bottom-nav d-lg-none"
    mandatory
    grow
  >
    <v-btn
      v-for="item in navItems"
      :key="item.to"
      :value="item.to"
      @click="handleNavigation(item)"
      class="nav-btn"
      :class="{ 'active-nav': isActive(item) }"
    >
      <div class="position-relative">
        <Icon 
          :icon="isActive(item) ? item.activeIcon : item.icon" 
          size="24"
          :class="{ 'text-primary': isActive(item) }"
        />
        <v-chip
          v-if="item.badge"
          size="x-small"
          class="nav-badge"
          color="primary"
          variant="flat"
        >
          {{ item.badge }}
        </v-chip>
      </div>
      <span class="text-caption nav-label" :class="{ 'text-primary': isActive(item) }">
        {{ item.title }}
      </span>
    </v-btn>
  </v-bottom-navigation>
</template>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-btn {
  flex-direction: column !important;
  padding: 4px !important;
  min-height: 56px !important;
}

.nav-btn .v-btn__content {
  flex-direction: column !important;
  gap: 2px;
}

.nav-label {
  font-size: 11px !important;
  line-height: 1 !important;
}

.active-nav {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

.nav-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  font-size: 9px !important;
  height: 16px !important;
  min-width: 0 !important;
  padding: 0 4px !important;
}

/* Ensure page content doesn't get hidden behind nav */
@media (max-width: 1280px) {
  :global(.v-main) {
    padding-bottom: 72px !important;
  }
}
</style>