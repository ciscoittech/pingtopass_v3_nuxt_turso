<template>
  <div class="text-center py-12">
    <Icon 
      :icon="icon" 
      size="64" 
      class="mb-4 text-grey-lighten-1" 
    />
    <h5 class="text-h5 mb-2">{{ title }}</h5>
    <p class="text-body-1 text-medium-emphasis mb-6 mx-auto" style="max-width: 400px;">
      {{ subtitle }}
    </p>
    <v-btn 
      v-if="actionText"
      color="primary" 
      variant="flat"
      rounded="pill"
      @click="$emit('action')"
    >
      <Icon icon="solar:add-circle-line-duotone" class="mr-2" size="20" />
      {{ actionText }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  icon?: string
  title: string
  subtitle: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'solar:box-minimalistic-broken'
})

defineEmits<{
  action: []
}>()
</script>