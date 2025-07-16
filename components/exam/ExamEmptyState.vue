<template>
  <v-row class="d-flex justify-center exam-empty-state" data-testid="exam-empty-state">
    <v-col class="text-center" lg="12">
      <v-img
        :src="image"
        :alt="title"
        class="mx-auto my-10"
        :height="imageHeight"
        max-width="400"
      />
      <h1 class="text-h4 font-weight-bold mb-3">{{ title }}</h1>
      <p class="text-body-1 text-grey-darken-1 mb-6">{{ subtitle }}</p>
      
      <div v-if="$slots.actions" class="mt-4">
        <slot name="actions"></slot>
      </div>
      
      <div v-else-if="showDefaultActions">
        <v-btn
          color="primary"
          size="large"
          rounded="pill"
          class="mr-2"
          @click="$emit('primary-action')"
        >
          {{ primaryActionText }}
        </v-btn>
        <v-btn
          v-if="secondaryActionText"
          variant="outlined"
          size="large"
          rounded="pill"
          @click="$emit('secondary-action')"
        >
          {{ secondaryActionText }}
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
interface Props {
  image?: string
  imageHeight?: number
  title?: string
  subtitle?: string
  primaryActionText?: string
  secondaryActionText?: string
  showDefaultActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  image: '/images/empty-states/no-exams.svg',
  imageHeight: 350,
  title: 'No Exams Found',
  subtitle: 'Try adjusting your filters or search criteria',
  primaryActionText: 'Clear Filters',
  showDefaultActions: true
})

const emit = defineEmits<{
  'primary-action': []
  'secondary-action': []
}>()
</script>

<style scoped>
.text-h4 {
  color: rgb(var(--v-theme-on-surface));
}
</style>