<template>
  <v-dialog
    v-model="show"
    max-width="400"
    persistent
  >
    <v-card>
      <v-card-text class="text-center pa-6">
        <v-icon
          size="64"
          :color="iconColor"
          class="mb-4"
        >
          {{ icon }}
        </v-icon>
        
        <h3 class="text-h5 font-weight-bold mb-2">
          {{ title }}
        </h3>
        
        <p class="text-body-1 text-medium-emphasis">
          {{ message }}
        </p>
        
        <div class="text-h4 font-weight-bold mt-4" :class="`text-${iconColor}`">
          {{ formattedTime }}
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleDismiss"
        >
          Continue Test
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSubmit"
        >
          Submit Now
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface Props {
  remainingMinutes: number
  warningType: 'five-minutes' | 'one-minute'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'dismiss': []
  'submit': []
}>()

// Local state
const show = ref(true)
const dismissed = ref(false)

// Computed
const iconColor = computed(() => {
  return props.warningType === 'one-minute' ? 'error' : 'warning'
})

const icon = computed(() => {
  return props.warningType === 'one-minute' ? 'mdi-alarm' : 'mdi-clock-alert'
})

const title = computed(() => {
  return props.warningType === 'one-minute' 
    ? 'Time is Almost Up!' 
    : 'Time Warning'
})

const message = computed(() => {
  if (props.warningType === 'one-minute') {
    return 'You have less than 1 minute remaining. Consider submitting your test now to ensure your answers are saved.'
  }
  return 'You have 5 minutes remaining. Start wrapping up your test.'
})

const formattedTime = computed(() => {
  const minutes = Math.floor(props.remainingMinutes)
  const seconds = Math.round((props.remainingMinutes - minutes) * 60)
  
  if (minutes === 0) {
    return `${seconds} seconds`
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
const handleDismiss = () => {
  show.value = false
  dismissed.value = true
  emit('dismiss')
}

const handleSubmit = () => {
  show.value = false
  emit('submit')
}

// Auto-dismiss after showing (unless critical)
onMounted(() => {
  if (props.warningType === 'five-minutes') {
    setTimeout(() => {
      if (show.value) {
        handleDismiss()
      }
    }, 10000) // Auto-dismiss after 10 seconds
  }
})
</script>