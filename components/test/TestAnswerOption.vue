<template>
  <v-card
    :variant="selected ? 'tonal' : 'outlined'"
    :color="selected ? 'primary' : 'default'"
    :elevation="selected ? 2 : 0"
    class="answer-option mb-3"
    :class="{
      'option-selected': selected
    }"
    @click="$emit('select')"
  >
    <v-card-text class="pa-4">
      <div class="d-flex align-center">
        <!-- Option Label -->
        <v-avatar
          :color="selected ? 'primary' : 'default'"
          :variant="selected ? 'flat' : 'tonal'"
          size="40"
          class="mr-4"
        >
          <span class="font-weight-bold">{{ optionLabel }}</span>
        </v-avatar>

        <!-- Option Text -->
        <div class="flex-grow-1">
          <p class="text-body-1 mb-0" :class="{ 'font-weight-medium': selected }">
            {{ option }}
          </p>
        </div>

        <!-- Selection Indicator -->
        <v-icon
          :color="selected ? 'primary' : 'grey-lighten-1'"
          size="28"
        >
          {{ selectionIcon }}
        </v-icon>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  option: string
  index: number
  selected: boolean
  isMultipleChoice: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: []
}>()

// Computed
const optionLabel = computed(() => {
  return String.fromCharCode(65 + props.index) // A, B, C, D...
})

const selectionIcon = computed(() => {
  return props.isMultipleChoice 
    ? (props.selected ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank')
    : (props.selected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline')
})
</script>

<style lang="scss" scoped>
.answer-option {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  &.option-selected {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2);
  }
}
</style>