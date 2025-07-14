<script setup lang="ts">
interface StudyReminder {
  id: string
  title: string
  message: string
  type: 'streak' | 'goal' | 'weak_area' | 'motivation'
  priority: 'low' | 'medium' | 'high'
  action?: {
    text: string
    route?: string
    callback?: () => void
  }
}

interface Props {
  reminder: StudyReminder
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['dismiss', 'action'])

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'streak': return 'mdi-fire'
    case 'goal': return 'mdi-target'
    case 'weak_area': return 'mdi-school'
    case 'motivation': return 'mdi-heart'
    default: return 'mdi-bell'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'streak': return 'orange'
    case 'goal': return 'primary'
    case 'weak_area': return 'warning'
    case 'motivation': return 'success'
    default: return 'info'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'grey'
  }
}
</script>

<template>
  <v-snackbar
    :model-value="show"
    location="bottom right"
    :timeout="-1"
    color="transparent"
    class="reminder-notification"
  >
    <v-card
      :color="getTypeColor(reminder.type)"
      variant="elevated"
      elevation="6"
      class="reminder-card"
      max-width="400"
    >
      <v-card-text class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-icon
            :color="reminder.priority === 'high' ? 'white' : undefined"
            size="24"
            class="mr-3"
          >
            {{ getTypeIcon(reminder.type) }}
          </v-icon>
          
          <div class="flex-grow-1">
            <h4 class="text-subtitle-1 font-weight-bold text-white">
              {{ reminder.title }}
            </h4>
          </div>
          
          <v-chip
            :color="getPriorityColor(reminder.priority)"
            size="x-small"
            variant="elevated"
          >
            {{ reminder.priority }}
          </v-chip>
        </div>
        
        <p class="text-body-2 text-grey-lighten-1 mb-4">
          {{ reminder.message }}
        </p>
        
        <div class="d-flex justify-end">
          <v-btn
            variant="text"
            color="grey-lighten-1"
            size="small"
            @click="emit('dismiss')"
          >
            Dismiss
          </v-btn>
          
          <v-btn
            v-if="reminder.action"
            color="white"
            :text-color="getTypeColor(reminder.type)"
            variant="elevated"
            size="small"
            class="ml-2"
            @click="emit('action')"
          >
            {{ reminder.action.text }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-snackbar>
</template>

<style scoped>
.reminder-notification {
  z-index: 9998;
}

.reminder-card {
  animation: slideInRight 0.4s ease-out;
  border-left: 4px solid rgba(255, 255, 255, 0.5);
}

@keyframes slideInRight {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .reminder-card {
    max-width: 320px;
  }
}
</style>