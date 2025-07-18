<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useActiveSession } from '~/composables/useActiveSession'

interface Exam {
  id: string
  name: string
  code: string
}

const props = defineProps<{
  exams: Exam[]
}>()

const { getQuickActions, lastActivity, activeStudySessions, activeTestSessions } = useActiveSession()

// Get smart quick actions
const quickActions = computed(() => {
  const actions = []
  
  // Continue last activity
  if (lastActivity.value) {
    actions.push({
      id: 'continue-last',
      title: `Continue ${lastActivity.value.examCode}`,
      subtitle: lastActivity.value.mode === 'study' ? 'Resume studying' : 'Resume test',
      icon: lastActivity.value.mode === 'study' ? 'solar:book-2-bold-duotone' : 'solar:timer-start-bold-duotone',
      color: 'primary',
      to: `/${lastActivity.value.mode}/${lastActivity.value.examId}`,
      badge: lastActivity.value.progress ? `${lastActivity.value.progress}%` : null
    })
  }
  
  // Add active test if different from last activity
  const activeTests = activeTestSessions.value.filter(t => t.examId !== lastActivity.value?.examId)
  if (activeTests.length > 0) {
    const test = activeTests[0]
    actions.push({
      id: 'resume-test',
      title: `Resume Test: ${test.examCode}`,
      subtitle: 'Continue your test',
      icon: 'solar:timer-pause-bold-duotone',
      color: 'warning',
      to: `/test/${test.examId}`,
      badge: test.progress ? `${test.progress}%` : null
    })
  }
  
  // Add recent study sessions
  const recentStudy = activeStudySessions.value.filter(s => s.examId !== lastActivity.value?.examId).slice(0, 2)
  recentStudy.forEach((session, index) => {
    actions.push({
      id: `study-${index}`,
      title: session.examCode,
      subtitle: 'Continue studying',
      icon: 'solar:book-open-bold-duotone',
      color: 'info',
      to: `/study/${session.examId}`,
      badge: session.progress ? `${session.progress}%` : null
    })
  })
  
  // If we have less than 3 actions, add popular exams
  if (actions.length < 3 && props.exams.length > 0) {
    const remainingSlots = 3 - actions.length
    const popularExams = props.exams
      .filter(exam => !actions.some(a => a.to.includes(exam.id)))
      .slice(0, remainingSlots)
    
    popularExams.forEach(exam => {
      actions.push({
        id: `exam-${exam.id}`,
        title: exam.code,
        subtitle: 'Start studying',
        icon: 'solar:play-circle-bold-duotone',
        color: 'success',
        to: `/study/${exam.id}`,
        badge: null
      })
    })
  }
  
  // If still no actions, show browse exams
  if (actions.length === 0) {
    actions.push({
      id: 'browse',
      title: 'Browse Exams',
      subtitle: 'Start your certification journey',
      icon: 'solar:document-text-bold-duotone',
      color: 'success',
      to: '/exams',
      badge: null
    })
  }
  
  return actions.slice(0, 3)
})
</script>

<template>
  <v-card elevation="10" class="h-100">
    <v-card-text class="pa-3">
      <div class="d-flex justify-space-between align-center mb-3">
        <div class="d-flex align-center">
          <Icon icon="solar:rocket-bold-duotone" size="20" class="text-primary mr-2" />
          <h6 class="text-h6 font-weight-semibold">Quick Actions</h6>
        </div>
        <v-chip 
          color="primary" 
          variant="tonal" 
          size="x-small"
          v-if="lastActivity"
        >
          Active
        </v-chip>
      </div>
      
      <v-list class="py-0" density="compact">
        <v-list-item 
          v-for="action in quickActions" 
          :key="action.id"
          :to="action.to"
          class="px-2 mb-2 rounded quick-action-item"
          :class="`bg-light${action.color}`"
          :color="action.color"
          density="compact"
        >
          <template v-slot:prepend>
            <v-avatar :color="action.color" variant="tonal" size="32">
              <Icon :icon="action.icon" width="16" height="16" />
            </v-avatar>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ action.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ action.subtitle }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <div class="d-flex align-center gap-2">
              <v-chip 
                v-if="action.badge" 
                size="x-small" 
                :color="action.color"
                variant="tonal"
              >
                {{ action.badge }}
              </v-chip>
              <Icon icon="solar:arrow-right-linear" width="16" height="16" class="text-grey100" />
            </div>
          </template>
        </v-list-item>
      </v-list>
      
      <v-btn 
        color="primary" 
        variant="tonal" 
        block 
        to="/exams" 
        size="small" 
        class="mt-2"
      >
        <Icon icon="solar:eye-scan-linear" width="16" height="16" class="mr-1" />
        Browse All Exams
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.quick-action-item {
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.quick-action-item:hover {
  transform: translateX(4px);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.bg-lightprimary {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

.bg-lightsuccess {
  background-color: rgba(var(--v-theme-success), 0.05) !important;
}

.bg-lightinfo {
  background-color: rgba(var(--v-theme-info), 0.05) !important;
}

.bg-lightwarning {
  background-color: rgba(var(--v-theme-warning), 0.05) !important;
}
</style>