<script setup lang="ts">
interface Props {
  questionId: string
  isFlagged?: boolean
  flagType?: 'review' | 'difficult' | 'incorrect' | 'confusing'
  size?: 'small' | 'default' | 'large'
  variant?: 'icon' | 'button'
}

interface Emits {
  (e: 'toggle', questionId: string, isFlagged: boolean, flagType?: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isFlagged: false,
  flagType: 'review',
  size: 'default',
  variant: 'icon'
})

const emit = defineEmits<Emits>()

const isFlagged = ref(props.isFlagged)
const isLoading = ref(false)
const showReasonDialog = ref(false)
const selectedFlagType = ref(props.flagType)
const flagReason = ref('')

const flagTypes = [
  { value: 'review', label: 'Review Later', icon: 'mdi-flag-outline', color: 'blue' },
  { value: 'difficult', label: 'Difficult', icon: 'mdi-flag-variant', color: 'orange' },
  { value: 'incorrect', label: 'Incorrect Answer', icon: 'mdi-flag-remove', color: 'red' },
  { value: 'confusing', label: 'Confusing', icon: 'mdi-flag-question', color: 'purple' }
]

const getCurrentFlagType = () => {
  return flagTypes.find(type => type.value === selectedFlagType.value) || flagTypes[0]
}

const toggleFlag = async (flagType?: string, reason?: string) => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    // Optimistic update
    const newFlagState = !isFlagged.value
    isFlagged.value = newFlagState
    
    if (newFlagState && !flagType) {
      // Show dialog to select flag type if flagging
      showReasonDialog.value = true
      isLoading.value = false
      return
    }
    
    // API call to toggle flag
    const { data } = await $fetch(`/api/study/flag`, {
      method: 'POST',
      body: {
        questionId: props.questionId,
        isFlagged: newFlagState,
        flagType: flagType || selectedFlagType.value,
        reason
      }
    })
    
    // Confirm the state from server
    isFlagged.value = data.isFlagged
    if (data.flagType) {
      selectedFlagType.value = data.flagType
    }
    
    // Emit event for parent component
    emit('toggle', props.questionId, data.isFlagged, data.flagType)
    
  } catch (error) {
    // Revert optimistic update on error
    isFlagged.value = !isFlagged.value
    console.error('Failed to toggle flag:', error)
  } finally {
    isLoading.value = false
    showReasonDialog.value = false
    flagReason.value = ''
  }
}

const confirmFlag = () => {
  toggleFlag(selectedFlagType.value, flagReason.value)
}

const getIconSize = () => {
  switch (props.size) {
    case 'small': return '16'
    case 'large': return '28'
    default: return '20'
  }
}

const getButtonSize = () => {
  switch (props.size) {
    case 'small': return 'small'
    case 'large': return 'large'
    default: return 'default'
  }
}

// Watch for external changes to isFlagged prop
watch(() => props.isFlagged, (newValue) => {
  isFlagged.value = newValue
})

watch(() => props.flagType, (newValue) => {
  if (newValue) {
    selectedFlagType.value = newValue
  }
})
</script>

<template>
  <div class="flag-button">
    <!-- Icon variant -->
    <v-btn
      v-if="variant === 'icon'"
      :size="getButtonSize()"
      :color="isFlagged ? getCurrentFlagType().color : 'grey'"
      :variant="isFlagged ? 'tonal' : 'text'"
      :loading="isLoading"
      icon
      @click="toggleFlag()"
    >
      <v-icon :size="getIconSize()">
        {{ isFlagged ? getCurrentFlagType().icon : 'mdi-flag-outline' }}
      </v-icon>
    </v-btn>
    
    <!-- Button variant -->
    <v-btn
      v-else
      :size="getButtonSize()"
      :color="isFlagged ? getCurrentFlagType().color : 'grey'"
      :variant="isFlagged ? 'tonal' : 'outlined'"
      :loading="isLoading"
      @click="toggleFlag()"
    >
      <v-icon :start="true" :size="getIconSize()">
        {{ isFlagged ? getCurrentFlagType().icon : 'mdi-flag-outline' }}
      </v-icon>
      {{ isFlagged ? getCurrentFlagType().label : 'Flag for Review' }}
    </v-btn>

    <!-- Flag Type Selection Dialog -->
    <v-dialog v-model="showReasonDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-flag</v-icon>
          Flag Question for Review
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <h4 class="text-subtitle-1 mb-3">Why are you flagging this question?</h4>
            
            <v-radio-group v-model="selectedFlagType" column>
              <v-radio
                v-for="flagType in flagTypes"
                :key="flagType.value"
                :value="flagType.value"
                :color="flagType.color"
              >
                <template #label>
                  <div class="d-flex align-center">
                    <v-icon :color="flagType.color" class="mr-2" size="20">
                      {{ flagType.icon }}
                    </v-icon>
                    <span>{{ flagType.label }}</span>
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </div>
          
          <v-textarea
            v-model="flagReason"
            label="Additional notes (optional)"
            placeholder="Add any specific details about why you're flagging this question..."
            rows="3"
            variant="outlined"
            max-length="500"
            counter
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="showReasonDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="getCurrentFlagType().color"
            variant="tonal"
            @click="confirmFlag"
          >
            <v-icon start>{{ getCurrentFlagType().icon }}</v-icon>
            Flag Question
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.flag-button .v-btn {
  transition: all 0.2s ease;
}

.flag-button .v-btn:hover {
  transform: scale(1.05);
}

.flag-button .v-btn[aria-pressed="true"] {
  animation: flag-added 0.3s ease-out;
}

@keyframes flag-added {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.v-radio-group .v-radio {
  margin-bottom: 8px;
}
</style>