<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-keyboard</v-icon>
      Keyboard Shortcuts
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        @click="$emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-divider />
    
    <v-card-text class="pa-4">
      <v-row>
        <!-- Answer Selection -->
        <v-col cols="12" md="6">
          <h4 class="text-subtitle-1 font-weight-semibold mb-3">
            <v-icon size="20" class="mr-2">mdi-cursor-default-click</v-icon>
            Answer Selection
          </h4>
          <v-list density="compact" class="pa-0">
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>A</kbd> - <kbd>F</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Select answer by letter
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>1</kbd> - <kbd>6</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Select answer by number
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>↑</kbd> <kbd>↓</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Navigate between options
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>

        <!-- Actions -->
        <v-col cols="12" md="6">
          <h4 class="text-subtitle-1 font-weight-semibold mb-3">
            <v-icon size="20" class="mr-2">mdi-lightning-bolt</v-icon>
            Quick Actions
          </h4>
          <v-list density="compact" class="pa-0">
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>Space</kbd> / <kbd>Enter</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Submit answer
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>Ctrl</kbd>+<kbd>B</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Bookmark question
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>Ctrl</kbd>+<kbd>F</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Flag for review
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>

        <!-- Navigation -->
        <v-col cols="12">
          <h4 class="text-subtitle-1 font-weight-semibold mb-3">
            <v-icon size="20" class="mr-2">mdi-navigation</v-icon>
            Navigation & Help
          </h4>
          <v-list density="compact" class="pa-0">
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>?</kbd> / <kbd>H</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Show this help dialog
              </v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <div class="shortcut-keys">
                  <kbd>Esc</kbd>
                </div>
              </template>
              <v-list-item-title class="text-body-2">
                Close dialogs
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-divider />
    
    <v-card-actions class="pa-4">
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        @click="$emit('close')"
      >
        Got it!
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()

// Close on Escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.shortcut-keys {
  min-width: 140px;
  text-align: right;
  margin-right: 16px;
}

kbd {
  display: inline-block;
  padding: 3px 6px;
  font-size: 0.75rem;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  font-family: 'Monaco', 'Menlo', monospace;
  margin: 0 2px;
}

.v-list-item {
  min-height: 36px;
}
</style>