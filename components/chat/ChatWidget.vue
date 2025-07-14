<template>
  <!-- Floating Action Button -->
  <div class="chat-widget-container">
    <transition name="fade-scale">
      <v-btn
        v-if="!isOpen"
        :fab="true"
        color="primary"
        size="large"
        class="chat-fab"
        elevation="8"
        @click="toggleChat"
      >
        <v-badge
          v-if="unreadCount > 0"
          :content="unreadCount"
          color="error"
          overlap
        >
          <v-icon>mdi-message-text</v-icon>
        </v-badge>
        <v-icon v-else>mdi-message-text</v-icon>
      </v-btn>
    </transition>

    <!-- Chat Window -->
    <transition name="slide-fade-up">
      <v-card
        v-if="isOpen"
        class="chat-window"
        :class="{ 'chat-window-mobile': isMobile }"
        elevation="12"
      >
        <!-- Chat Header -->
        <v-card-title class="chat-header pa-3">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="white">
                {{ isAdminMode ? 'mdi-shield-account' : 'mdi-robot-happy' }}
              </v-icon>
              <span class="text-h6 text-white">
                {{ isAdminMode ? 'Admin AI Assistant' : 'AI Study Assistant' }}
              </span>
            </div>
            <div>
              <v-btn
                icon
                size="small"
                variant="text"
                color="white"
                @click="minimizeChat"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="white"
                @click="closeChat"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-title>

        <!-- Session Tabs (Desktop Only) -->
        <v-tabs
          v-if="!isMobile && sessions.length > 0"
          v-model="activeTab"
          density="compact"
          class="chat-tabs"
        >
          <v-tab
            v-for="(session, index) in sessions"
            :key="session.id"
            :value="index"
          >
            {{ session.title || `Chat ${index + 1}` }}
          </v-tab>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="createNewSession"
            class="ml-2"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-tabs>

        <!-- Messages Area -->
        <v-card-text
          ref="messagesContainer"
          class="chat-messages pa-3"
          :class="{ 'chat-messages-mobile': isMobile }"
        >
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="text-center py-8">
            <v-icon size="48" color="grey">
              {{ isAdminMode ? 'mdi-shield-account-outline' : 'mdi-robot-happy-outline' }}
            </v-icon>
            <p class="text-grey mt-2">
              {{ isAdminMode 
                ? 'Admin AI Assistant with system access. How can I help?' 
                : 'Hi! I\'m your AI study assistant. How can I help you today?' }}
            </p>
            <div class="mt-4">
              <v-chip
                v-for="suggestion in suggestions"
                :key="suggestion"
                @click="sendMessage(suggestion)"
                class="ma-1"
                variant="outlined"
                size="small"
              >
                {{ suggestion }}
              </v-chip>
            </div>
          </div>

          <!-- Messages -->
          <div v-else>
            <div
              v-for="message in messages"
              :key="message.id"
              class="chat-message"
              :class="{
                'user-message': message.role === 'user',
                'assistant-message': message.role === 'assistant'
              }"
            >
              <div class="message-content">
                <div class="message-avatar">
                  <v-icon size="20">
                    {{ message.role === 'user' ? 'mdi-account' : 'mdi-robot' }}
                  </v-icon>
                </div>
                <div class="message-text">
                  {{ message.content }}
                </div>
              </div>
              <div class="message-time text-caption text-grey">
                {{ formatTime(message.createdAt) }}
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isLoading" class="chat-message assistant-message">
              <div class="message-content">
                <div class="message-avatar">
                  <v-icon size="20">mdi-robot</v-icon>
                </div>
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <!-- Input Area -->
        <v-card-actions class="chat-input-area pa-3">
          <v-textarea
            v-model="inputMessage"
            placeholder="Type your message..."
            :disabled="isLoading"
            @keydown.enter.prevent="handleEnter"
            rows="1"
            auto-grow
            max-rows="4"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <v-btn
            icon
            color="primary"
            :disabled="!inputMessage.trim() || isLoading"
            @click="sendMessage()"
            class="ml-2"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useChatStore } from '@/stores/chat'
import { useRoute } from 'vue-router'

const { mobile } = useDisplay()
const chatStore = useChatStore()
const route = useRoute()

// Check if we're in admin context
const isAdminMode = computed(() => route.path.startsWith('/admin'))

// Reactive refs
const messagesContainer = ref<HTMLElement>()
const activeTab = ref(0)

// Computed properties
const isOpen = computed(() => chatStore.isOpen)
const sessions = computed(() => chatStore.sessions)
const messages = computed(() => chatStore.messages)
const unreadCount = computed(() => chatStore.unreadCount)
const isLoading = computed(() => chatStore.isLoading)
const inputMessage = computed({
  get: () => chatStore.inputMessage,
  set: (value) => chatStore.setInputMessage(value)
})
const isMobile = computed(() => mobile.value)

// Suggestions for empty chat
const suggestions = computed(() => {
  if (isAdminMode.value) {
    return [
      'How many users do we have?',
      'Show me the top 5 most popular exams',
      'What is the average test score?',
      'Get recent activity for the last 7 days'
    ]
  } else {
    return [
      'Help me study for AWS certification',
      'Explain cloud computing concepts',
      'Create a study plan',
      'Quiz me on recent topics'
    ]
  }
})

// Methods
const toggleChat = () => {
  chatStore.toggleChat()
  if (chatStore.isOpen) {
    // Load sessions if not loaded
    if (chatStore.sessions.length === 0) {
      chatStore.fetchSessions()
    }
    // Mark messages as read
    chatStore.markAsRead()
    // Focus input after opening
    nextTick(() => {
      const textarea = document.querySelector('.chat-input-area textarea') as HTMLTextAreaElement
      textarea?.focus()
    })
  }
}

const minimizeChat = () => {
  chatStore.setOpen(false)
}

const closeChat = () => {
  chatStore.setOpen(false)
}

const createNewSession = () => {
  chatStore.createNewSession()
}

const sendMessage = async (text?: string) => {
  const message = text || inputMessage.value.trim()
  if (!message) return
  
  await chatStore.sendMessage(message, isAdminMode.value)
  await scrollToBottom()
}

const handleEnter = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    sendMessage()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

// Watch for new messages to scroll
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // ESC to close chat
  if (event.key === 'Escape' && isOpen.value) {
    closeChat()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.chat-widget-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

/* Floating Action Button */
.chat-fab {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* Chat Window */
.chat-window {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 400px;
  height: 600px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

.chat-window-mobile {
  bottom: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

/* Chat Header */
.chat-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.8) 100%);
  color: white;
}

/* Chat Tabs */
.chat-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

/* Messages Area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
}

.chat-messages-mobile {
  padding-bottom: 80px;
}

/* Message Styles */
.chat-message {
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-out;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.user-message .message-content {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.assistant-message .message-avatar {
  background: #F5F5F5;
  color: #616161;
}

.message-text {
  background: white;
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 75%;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-message .message-text {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.message-time {
  margin-top: 4px;
  margin-left: 40px;
  font-size: 11px;
}

.user-message .message-time {
  margin-left: 0;
  margin-right: 40px;
  text-align: right;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.typing-indicator span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  margin: 0 2px;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* Input Area */
.chat-input-area {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.slide-fade-up-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-fade-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Scrollbar Styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Responsive */
@media (max-width: 600px) {
  .chat-widget-container {
    bottom: 16px;
    right: 16px;
  }
}
</style>