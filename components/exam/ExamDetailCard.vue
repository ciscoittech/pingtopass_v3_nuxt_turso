<template>
  <v-card elevation="0" rounded="lg" class="exam-detail-card">
    <!-- Header Image with Overlay -->
    <v-img
      :src="headerImage"
      :lazy-src="defaultHeaderImage"
      height="320"
      cover
      class="align-end"
      gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)"
    >
      <template v-slot:error>
        <v-img
          :src="defaultHeaderImage"
          height="320"
          cover
          class="align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)"
        >
          <div class="pa-6">
            <slot name="header"></slot>
          </div>
        </v-img>
      </template>
      <div class="pa-6">
        <slot name="header"></slot>
      </div>
    </v-img>

    <!-- Content -->
    <v-card-text class="pa-6">
      <slot name="content"></slot>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  headerImage?: string
  defaultHeaderImage?: string
}

const props = withDefaults(defineProps<Props>(), {
  headerImage: '/images/exam-banners/default.jpg',
  defaultHeaderImage: '/images/exam-banners/default.jpg'
})
</script>

<style lang="scss" scoped>
.exam-detail-card {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
}

:deep(.v-img__img) {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.exam-detail-card:hover :deep(.v-img__img) {
  transform: scale(1.05);
}
</style>