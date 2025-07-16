<template>
  <div class="skeleton-loader" :class="skeletonClass" :style="skeletonStyle">
    <div class="skeleton-shimmer" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'text' | 'avatar' | 'card' | 'image' | 'button' | 'custom'
  width?: string | number
  height?: string | number
  rounded?: boolean | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  rounded: false
})

const skeletonClass = computed(() => {
  const classes = []
  
  if (props.type === 'avatar') {
    classes.push('skeleton-avatar')
  } else if (props.type === 'card') {
    classes.push('skeleton-card')
  } else if (props.type === 'image') {
    classes.push('skeleton-image')
  } else if (props.type === 'button') {
    classes.push('skeleton-button')
  }
  
  if (props.rounded === true) {
    classes.push('rounded')
  } else if (typeof props.rounded === 'string') {
    classes.push(props.rounded)
  }
  
  if (props.class) {
    classes.push(props.class)
  }
  
  return classes
})

const skeletonStyle = computed(() => {
  const style: any = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})
</script>

<style scoped>
.skeleton-loader {
  display: inline-block;
  position: relative;
  overflow: hidden;
  background-color: rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.5) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Preset types */
.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-card {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.skeleton-button {
  width: 120px;
  height: 36px;
  border-radius: 18px;
}

/* Rounded variants */
.skeleton-loader.rounded {
  border-radius: 50%;
}

.skeleton-loader.rounded-sm {
  border-radius: 4px;
}

.skeleton-loader.rounded-md {
  border-radius: 8px;
}

.skeleton-loader.rounded-lg {
  border-radius: 12px;
}

.skeleton-loader.rounded-xl {
  border-radius: 16px;
}
</style>