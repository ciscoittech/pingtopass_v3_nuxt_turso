<script setup lang="ts">
interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: 'streak' | 'accuracy' | 'volume' | 'milestone' | 'special'
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Props {
  achievement: Achievement
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'grey'
    case 'rare': return 'blue'
    case 'epic': return 'purple'
    case 'legendary': return 'orange'
    default: return 'grey'
  }
}

const getRarityGlow = (rarity: string) => {
  switch (rarity) {
    case 'rare': return 'box-shadow: 0 0 20px rgba(33, 150, 243, 0.3);'
    case 'epic': return 'box-shadow: 0 0 25px rgba(156, 39, 176, 0.4);'
    case 'legendary': return 'box-shadow: 0 0 30px rgba(255, 152, 0, 0.5);'
    default: return ''
  }
}

// Auto-close after 5 seconds
watch(() => props.show, (newShow) => {
  if (newShow) {
    setTimeout(() => {
      emit('close')
    }, 5000)
  }
})
</script>

<template>
  <v-snackbar
    :model-value="show"
    location="top"
    :timeout="-1"
    color="transparent"
    class="achievement-notification"
  >
    <v-card
      :color="getRarityColor(achievement.rarity)"
      variant="elevated"
      elevation="8"
      class="achievement-card"
      :style="getRarityGlow(achievement.rarity)"
    >
      <v-card-text class="pa-4">
        <div class="d-flex align-center">
          <!-- Achievement Icon -->
          <div class="achievement-icon mr-4">
            <v-avatar
              :color="getRarityColor(achievement.rarity)"
              size="60"
              class="elevation-4"
            >
              <v-icon
                :color="achievement.rarity === 'legendary' ? 'white' : undefined"
                size="32"
              >
                {{ achievement.icon }}
              </v-icon>
            </v-avatar>
          </div>

          <!-- Achievement Details -->
          <div class="flex-grow-1">
            <div class="d-flex align-center justify-space-between mb-1">
              <h3 class="text-h6 font-weight-bold text-white">
                🎉 Achievement Unlocked!
              </h3>
              <v-btn
                icon
                variant="text"
                size="small"
                color="white"
                @click="emit('close')"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            
            <h4 class="text-subtitle-1 font-weight-bold text-white mb-1">
              {{ achievement.title }}
            </h4>
            
            <p class="text-body-2 text-grey-lighten-1 mb-2">
              {{ achievement.description }}
            </p>
            
            <div class="d-flex align-center">
              <v-chip
                :color="achievement.rarity === 'common' ? 'grey-lighten-1' : 'white'"
                :text-color="achievement.rarity === 'common' ? 'black' : getRarityColor(achievement.rarity)"
                size="small"
                variant="elevated"
                class="mr-2"
              >
                {{ achievement.rarity.toUpperCase() }}
              </v-chip>
              
              <v-chip
                color="yellow"
                text-color="black"
                size="small"
                variant="elevated"
              >
                <v-icon start size="16">mdi-star</v-icon>
                +{{ achievement.points }} pts
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-snackbar>
</template>

<style scoped>
.achievement-notification {
  z-index: 9999;
}

.achievement-card {
  min-width: 400px;
  max-width: 500px;
  animation: achievementPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.achievement-icon {
  position: relative;
}

.achievement-icon::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
  pointer-events: none;
}

@keyframes achievementPop {
  0% {
    transform: scale(0.3) translateY(-100px);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) translateY(0);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    transform: rotate(0deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: rotate(360deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .achievement-card {
    min-width: 320px;
    max-width: 350px;
  }
}
</style>