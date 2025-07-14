<script setup lang="ts">
interface Props {
  questionId: string
  isBookmarked?: boolean
  size?: 'small' | 'default' | 'large'
  variant?: 'icon' | 'button'
}

interface Emits {
  (e: 'toggle', questionId: string, isBookmarked: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  isBookmarked: false,
  size: 'default',
  variant: 'icon'
})

const emit = defineEmits<Emits>()

const isBookmarked = ref(props.isBookmarked)
const isLoading = ref(false)

const toggleBookmark = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    // Optimistic update
    const newBookmarkState = !isBookmarked.value
    isBookmarked.value = newBookmarkState
    
    // API call to toggle bookmark
    const { data } = await $fetch(`/api/study/bookmark`, {
      method: 'POST',
      body: {
        questionId: props.questionId,
        isBookmarked: newBookmarkState
      }
    })
    
    // Confirm the state from server
    isBookmarked.value = data.isBookmarked
    
    // Emit event for parent component
    emit('toggle', props.questionId, data.isBookmarked)
    
  } catch (error) {
    // Revert optimistic update on error
    isBookmarked.value = !isBookmarked.value
    console.error('Failed to toggle bookmark:', error)
  } finally {
    isLoading.value = false
  }
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

// Watch for external changes to isBookmarked prop
watch(() => props.isBookmarked, (newValue) => {
  isBookmarked.value = newValue
})
</script>

<template>
  <div class="bookmark-button">
    <!-- Icon variant -->
    <v-btn
      v-if="variant === 'icon'"
      :size="getButtonSize()"
      :color="isBookmarked ? 'warning' : 'grey'"
      :variant="isBookmarked ? 'tonal' : 'text'"
      :loading="isLoading"
      icon
      @click="toggleBookmark"
    >
      <v-icon :size="getIconSize()">
        {{ isBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}
      </v-icon>
    </v-btn>
    
    <!-- Button variant -->
    <v-btn
      v-else
      :size="getButtonSize()"
      :color="isBookmarked ? 'warning' : 'grey'"
      :variant="isBookmarked ? 'tonal' : 'outlined'"
      :loading="isLoading"
      @click="toggleBookmark"
    >
      <v-icon :start="true" :size="getIconSize()">
        {{ isBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}
      </v-icon>
      {{ isBookmarked ? 'Bookmarked' : 'Bookmark' }}
    </v-btn>
  </div>
</template>

<style scoped>
.bookmark-button .v-btn {
  transition: all 0.2s ease;
}

.bookmark-button .v-btn:hover {
  transform: scale(1.05);
}

.bookmark-button .v-btn[aria-pressed="true"] {
  animation: bookmark-added 0.3s ease-out;
}

@keyframes bookmark-added {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>