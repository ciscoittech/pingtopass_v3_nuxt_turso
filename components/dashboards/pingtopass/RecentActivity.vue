<script setup lang="ts">
import { ref } from "vue";
import { Icon } from '@iconify/vue';
import { DotsVerticalIcon } from 'vue-tabler-icons';

interface ActivityItem {
  id: string;
  type: 'study' | 'test' | 'achievement' | 'exam';
  title: string;
  description: string;
  timestamp: number;
  metadata?: {
    score?: number;
    questions?: number;
    duration?: number;
    examCode?: string;
  };
}

interface Props {
  activities?: ActivityItem[];
}

const props = withDefaults(defineProps<Props>(), {
  activities: () => []
});

const items = ref([
    { title: "View All" },
    { title: "This Week" },
    { title: "This Month" },
]);

// State for real activities
const realActivities = ref<ActivityItem[]>([])
const loading = ref(true)

// Load recent test activities
const loadRecentActivity = async () => {
  try {
    loading.value = true
    
    // Fetch recent test sessions
    const testResponse = await $fetch('/api/sessions/test/history?limit=5')
    
    const activities: ActivityItem[] = []
    
    if (testResponse.success && testResponse.data?.sessions) {
      testResponse.data.sessions.forEach((session: any) => {
        activities.push({
          id: session.id,
          type: 'test',
          title: 'Practice Test Completed',
          description: `${session.examCode} - ${session.examName}`,
          timestamp: session.submittedAt ? session.submittedAt * 1000 : session.startedAt * 1000,
          metadata: {
            score: session.score,
            questions: session.totalQuestions,
            duration: session.timeSpentSeconds,
            examCode: session.examCode
          }
        })
      })
    }
    
    // TODO: Add study sessions when available
    // TODO: Add achievements when available
    
    realActivities.value = activities.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to load recent activity:', error)
    
    // Fall back to default activities on error
    realActivities.value = defaultActivities
  } finally {
    loading.value = false
  }
}

// Mock data fallback
const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'study',
    title: 'Studied CompTIA Security+',
    description: 'Completed chapter on Network Security',
    timestamp: Date.now() - 3600000,
    metadata: {
      questions: 45,
      duration: 1800,
      examCode: 'SY0-601'
    }
  },
  {
    id: '2',
    type: 'test',
    title: 'Practice Test Completed',
    description: 'AWS Solutions Architect',
    timestamp: Date.now() - 7200000,
    metadata: {
      score: 82,
      questions: 65,
      examCode: 'SAA-C03'
    }
  },
  {
    id: '3',
    type: 'achievement',
    title: 'New Achievement Unlocked',
    description: '7-Day Study Streak',
    timestamp: Date.now() - 86400000
  },
  {
    id: '4',
    type: 'exam',
    title: 'New Exam Available',
    description: 'Microsoft AZ-104 added to library',
    timestamp: Date.now() - 172800000,
    metadata: {
      examCode: 'AZ-104'
    }
  }
];

const displayActivities = computed(() => {
  if (props.activities.length > 0) {
    return props.activities
  }
  
  if (realActivities.value.length > 0) {
    return realActivities.value
  }
  
  return defaultActivities
});

// Load on mount
onMounted(() => {
  loadRecentActivity()
})

// Helper functions
const getActivityIcon = (type: string) => {
  const icons = {
    study: 'solar:book-2-linear',
    test: 'solar:document-text-linear',
    achievement: 'solar:trophy-linear',
    exam: 'solar:graduation-cap-linear'
  };
  return icons[type] || 'solar:info-circle-linear';
};

const getActivityColor = (type: string) => {
  const colors = {
    study: 'primary',
    test: 'info',
    achievement: 'warning',
    exam: 'success'
  };
  return colors[type] || 'grey';
};

const formatTimestamp = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};
</script>

<template>
    <v-card elevation="10" class="h-100">
        <v-card-text>
            <div class="d-flex align-center justify-space-between mb-4">
                <div>
                    <h5 class="text-h5 mb-1 font-weight-semibold">Recent Activity</h5>
                    <p class="text-subtitle-2 text-grey100">Your latest study sessions</p>
                </div>
                <div>
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon color="inherit" v-bind="props" variant="text">
                                <DotsVerticalIcon stroke-width="1.5" size="24" class="text-grey100" />
                            </v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item v-for="(item, i) in items" :key="i" :value="i">
                                <v-list-item-title>{{ item.title }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </div>

            <perfect-scrollbar style="height: 420px">
                <v-timeline side="end" density="compact" class="activity-timeline">
                    <v-timeline-item
                        v-for="activity in displayActivities"
                        :key="activity.id"
                        :dot-color="getActivityColor(activity.type)"
                        size="small"
                    >
                        <template v-slot:icon>
                            <v-avatar size="32" :color="getActivityColor(activity.type)" variant="tonal">
                                <Icon :icon="getActivityIcon(activity.type)" size="16" />
                            </v-avatar>
                        </template>
                        
                        <div class="activity-content">
                            <div class="d-flex justify-space-between align-start mb-1">
                                <h6 class="text-subtitle-1 font-weight-semibold">{{ activity.title }}</h6>
                                <span class="text-caption text-grey100">{{ formatTimestamp(activity.timestamp) }}</span>
                            </div>
                            
                            <p class="text-body-2 text-grey100 mb-2">{{ activity.description }}</p>
                            
                            <!-- Metadata chips -->
                            <div v-if="activity.metadata" class="d-flex flex-wrap gap-2">
                                <v-chip v-if="activity.metadata.score" size="x-small" variant="tonal" :color="activity.metadata.score >= 70 ? 'success' : 'warning'">
                                    <Icon icon="solar:star-linear" size="12" class="mr-1" />
                                    {{ activity.metadata.score }}%
                                </v-chip>
                                <v-chip v-if="activity.metadata.questions" size="x-small" variant="tonal" color="info">
                                    <Icon icon="solar:question-circle-linear" size="12" class="mr-1" />
                                    {{ activity.metadata.questions }} questions
                                </v-chip>
                                <v-chip v-if="activity.metadata.duration" size="x-small" variant="tonal" color="primary">
                                    <Icon icon="solar:clock-circle-linear" size="12" class="mr-1" />
                                    {{ formatDuration(activity.metadata.duration) }}
                                </v-chip>
                                <v-chip v-if="activity.metadata.examCode" size="x-small" variant="outlined">
                                    {{ activity.metadata.examCode }}
                                </v-chip>
                            </div>
                        </div>
                    </v-timeline-item>
                </v-timeline>
                
                <!-- Empty state -->
                <div v-if="displayActivities.length === 0" class="text-center py-8">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">
                        mdi-history
                    </v-icon>
                    <h6 class="text-h6 mb-2">No Recent Activity</h6>
                    <p class="text-body-2 text-grey100">Start studying to see your activity here</p>
                    <v-btn color="primary" variant="flat" class="mt-4" to="/exams">
                        Browse Exams
                    </v-btn>
                </div>
            </perfect-scrollbar>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.activity-timeline {
    padding-left: 0;
}

.activity-timeline :deep(.v-timeline-item__body) {
    padding-bottom: 24px;
}

.activity-timeline :deep(.v-timeline-item:last-child .v-timeline-item__body) {
    padding-bottom: 0;
}

.activity-content {
    padding: 16px;
    background: rgba(var(--v-theme-surface-variant), 0.4);
    border-radius: 8px;
    border: 1px solid rgba(var(--v-border-color), 0.08);
    transition: all 0.2s ease;
}

.activity-content:hover {
    background: rgba(var(--v-theme-surface-variant), 0.6);
    transform: translateX(2px);
}
</style>