<script setup lang="ts">
interface Props {
  dailyStats: Array<{
    date: string
    studyTime: number
    questionsAnswered: number
    accuracy: number
    sessions: number
  }>
  period: string
}

const props = defineProps<Props>()

// Generate calendar grid
const calendarData = computed(() => {
  const today = new Date()
  const days = []
  
  // Get the number of days based on period
  let daysToShow = 30 // default month
  switch (props.period) {
    case 'week':
      daysToShow = 7
      break
    case 'quarter':
      daysToShow = 90
      break
    case 'year':
      daysToShow = 365
      break
  }
  
  // Create array of dates
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dateString = date.toISOString().split('T')[0]
    const dayData = props.dailyStats.find(stat => stat.date === dateString)
    
    days.push({
      date: dateString,
      dayOfMonth: date.getDate(),
      dayOfWeek: date.getDay(),
      monthName: date.toLocaleDateString('en-US', { month: 'short' }),
      studyTime: dayData?.studyTime || 0,
      questionsAnswered: dayData?.questionsAnswered || 0,
      accuracy: dayData?.accuracy || 0,
      sessions: dayData?.sessions || 0,
      isToday: dateString === today.toISOString().split('T')[0],
      hasActivity: (dayData?.studyTime || 0) > 0
    })
  }
  
  return days
})

// Get activity level for color coding
const getActivityLevel = (studyTime: number) => {
  if (studyTime === 0) return 0
  if (studyTime < 300) return 1 // < 5 minutes
  if (studyTime < 900) return 2 // < 15 minutes
  if (studyTime < 1800) return 3 // < 30 minutes
  return 4 // 30+ minutes
}

const getActivityColor = (level: number) => {
  const colors = [
    '#f0f0f0', // No activity
    '#c6e48b', // Light activity
    '#7bc96f', // Medium-low activity
    '#239a3b', // Medium-high activity
    '#196127'  // High activity
  ]
  return colors[level] || colors[0]
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  return `${minutes}m`
}

// Group days by week for better layout
const weeklyGroups = computed(() => {
  const weeks = []
  let currentWeek = []
  
  calendarData.value.forEach((day, index) => {
    currentWeek.push(day)
    
    // Start new week on Sunday (dayOfWeek === 0) or when we have 7 days
    if (day.dayOfWeek === 6 || currentWeek.length === 7) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  // Add remaining days
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }
  
  return weeks
})

const selectedDay = ref(null as any)
const showDayDetails = ref(false)

const selectDay = (day: any) => {
  if (day.hasActivity) {
    selectedDay.value = day
    showDayDetails.value = true
  }
}
</script>

<template>
  <div class="activity-calendar">
    <!-- Legend -->
    <div class="calendar-legend mb-4">
      <div class="d-flex align-center justify-space-between">
        <span class="text-body-2 text-grey-darken-1">Daily Study Activity</span>
        <div class="d-flex align-center">
          <span class="text-caption text-grey-darken-1 mr-2">Less</span>
          <div 
            v-for="level in 5" 
            :key="level"
            class="legend-square mr-1"
            :style="{ backgroundColor: getActivityColor(level - 1) }"
          />
          <span class="text-caption text-grey-darken-1 ml-2">More</span>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div v-if="period === 'week' || period === 'month'" class="calendar-grid">
      <div class="day-labels mb-2">
        <div class="day-label">Sun</div>
        <div class="day-label">Mon</div>
        <div class="day-label">Tue</div>
        <div class="day-label">Wed</div>
        <div class="day-label">Thu</div>
        <div class="day-label">Fri</div>
        <div class="day-label">Sat</div>
      </div>
      
      <div class="weeks-container">
        <div 
          v-for="(week, weekIndex) in weeklyGroups" 
          :key="weekIndex" 
          class="week-row"
        >
          <div
            v-for="(day, dayIndex) in week"
            :key="day.date"
            class="day-cell"
            :class="{
              'day-today': day.isToday,
              'day-has-activity': day.hasActivity,
              'day-clickable': day.hasActivity
            }"
            :style="{ backgroundColor: getActivityColor(getActivityLevel(day.studyTime)) }"
            @click="selectDay(day)"
          >
            <v-tooltip location="top">
              <template #activator="{ props: tooltipProps }">
                <div 
                  v-bind="tooltipProps"
                  class="day-content"
                >
                  {{ day.dayOfMonth }}
                </div>
              </template>
              
              <div class="day-tooltip">
                <div class="font-weight-bold">{{ new Date(day.date).toLocaleDateString() }}</div>
                <div v-if="day.hasActivity">
                  <div>Study Time: {{ formatTime(day.studyTime) }}</div>
                  <div>Questions: {{ day.questionsAnswered }}</div>
                  <div>Accuracy: {{ Math.round(day.accuracy) }}%</div>
                  <div>Sessions: {{ day.sessions }}</div>
                </div>
                <div v-else class="text-grey-lighten-1">No activity</div>
              </div>
            </v-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Simplified view for longer periods -->
    <div v-else class="activity-bars">
      <div class="bars-container">
        <div
          v-for="day in calendarData"
          :key="day.date"
          class="activity-bar"
          :style="{ 
            height: `${Math.max(2, (day.studyTime / 3600) * 100)}px`,
            backgroundColor: getActivityColor(getActivityLevel(day.studyTime))
          }"
          @click="selectDay(day)"
        >
          <v-tooltip location="top">
            <template #activator="{ props: tooltipProps }">
              <div v-bind="tooltipProps" class="bar-content" />
            </template>
            
            <div class="day-tooltip">
              <div class="font-weight-bold">{{ new Date(day.date).toLocaleDateString() }}</div>
              <div v-if="day.hasActivity">
                <div>Study Time: {{ formatTime(day.studyTime) }}</div>
                <div>Questions: {{ day.questionsAnswered }}</div>
                <div>Accuracy: {{ Math.round(day.accuracy) }}%</div>
              </div>
              <div v-else class="text-grey-lighten-1">No activity</div>
            </div>
          </v-tooltip>
        </div>
      </div>
    </div>

    <!-- Day Details Dialog -->
    <v-dialog v-model="showDayDetails" max-width="400px">
      <v-card v-if="selectedDay">
        <v-card-title>
          {{ new Date(selectedDay.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) }}
        </v-card-title>
        
        <v-card-text>
          <v-list density="compact">
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-clock-outline</v-icon>
              </template>
              <v-list-item-title>Study Time</v-list-item-title>
              <v-list-item-subtitle>{{ formatTime(selectedDay.studyTime) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon color="success">mdi-help-circle</v-icon>
              </template>
              <v-list-item-title>Questions Answered</v-list-item-title>
              <v-list-item-subtitle>{{ selectedDay.questionsAnswered }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon color="warning">mdi-target</v-icon>
              </template>
              <v-list-item-title>Accuracy</v-list-item-title>
              <v-list-item-subtitle>{{ Math.round(selectedDay.accuracy) }}%</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon color="info">mdi-play-circle</v-icon>
              </template>
              <v-list-item-title>Study Sessions</v-list-item-title>
              <v-list-item-subtitle>{{ selectedDay.sessions }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDayDetails = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.activity-calendar {
  max-width: 100%;
}

.calendar-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.legend-square {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.calendar-grid {
  width: 100%;
}

.day-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 8px;
}

.day-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
  padding: 4px;
}

.weeks-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 32px;
}

.day-today {
  border: 2px solid #1976d2 !important;
  font-weight: bold;
}

.day-clickable {
  cursor: pointer;
}

.day-clickable:hover {
  transform: scale(1.1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.day-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-bars {
  width: 100%;
  height: 120px;
  position: relative;
}

.bars-container {
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 1px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.activity-bar {
  min-width: 3px;
  flex: 1;
  max-width: 8px;
  border-radius: 2px 2px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.activity-bar:hover {
  transform: scaleY(1.1);
  opacity: 0.8;
}

.bar-content {
  width: 100%;
  height: 100%;
}

.day-tooltip {
  text-align: left;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .day-cell {
    min-height: 28px;
    font-size: 0.7rem;
  }
  
  .legend-square {
    width: 10px;
    height: 10px;
  }
  
  .activity-bars {
    height: 100px;
  }
}
</style>