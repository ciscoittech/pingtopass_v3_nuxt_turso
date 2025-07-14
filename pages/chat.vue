<template>
  <NuxtLayout>
    <v-container fluid>
      <v-row>
        <!-- Chat Sessions List -->
        <v-col cols="12" md="3">
          <v-card class="chat-sidebar">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Chat Sessions</span>
              <v-btn icon size="small" @click="createNewSession">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-list>
              <v-list-item
                v-for="session in sessions"
                :key="session.id"
                @click="selectSession(session.id)"
                :active="session.id === currentSessionId"
              >
                <v-list-item-title>{{ session.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ session.messageCount }} messages
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="sessions.length === 0">
                <v-list-item-title class="text-grey">
                  No chat sessions yet
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Chat Window -->
        <v-col cols="12" md="9">
          <v-card class="chat-window d-flex flex-column" height="600">
            <!-- Chat Header -->
            <v-card-title class="chat-header">
              <span v-if="currentSession">{{ currentSession.title }}</span>
              <span v-else>AI Study Assistant</span>
            </v-card-title>
            <v-divider />

            <!-- Messages Area -->
            <v-card-text class="flex-grow-1 overflow-y-auto messages-area" ref="messagesArea">
              <div v-if="!currentSessionId" class="text-center text-grey mt-10">
                <v-icon size="64" color="grey">mdi-robot-happy</v-icon>
                <p class="mt-4">Start a new conversation with your AI study assistant!</p>
              </div>

              <div v-else>
                <div
                  v-for="message in messages"
                  :key="message.id"
                  :class="['message', message.role === 'user' ? 'user-message' : 'assistant-message']"
                >
                  <div class="message-header">
                    <v-icon size="small" class="mr-2">
                      {{ message.role === 'user' ? 'mdi-account' : 'mdi-robot' }}
                    </v-icon>
                    <span class="font-weight-bold">
                      {{ message.role === 'user' ? 'You' : 'AI Assistant' }}
                    </span>
                  </div>
                  <div class="message-content">
                    {{ message.content }}
                  </div>
                </div>

                <div v-if="isLoading" class="message assistant-message">
                  <div class="message-header">
                    <v-icon size="small" class="mr-2">mdi-robot</v-icon>
                    <span class="font-weight-bold">AI Assistant</span>
                  </div>
                  <div class="message-content">
                    <v-progress-circular
                      indeterminate
                      size="16"
                      width="2"
                      class="mr-2"
                    />
                    Thinking...
                  </div>
                </div>
              </div>
            </v-card-text>

            <!-- Input Area -->
            <v-divider />
            <v-card-actions class="chat-input-area pa-4">
              <v-textarea
                v-model="inputMessage"
                :loading="isLoading"
                :disabled="isLoading"
                placeholder="Type your message..."
                rows="2"
                auto-grow
                hide-details
                variant="outlined"
                @keydown.enter.prevent="sendMessage"
                class="flex-grow-1 mr-2"
              />
              <v-btn
                color="primary"
                :loading="isLoading"
                :disabled="!inputMessage.trim() || isLoading"
                @click="sendMessage"
              >
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

// Page metadata
definePageMeta({
  title: 'AI Study Assistant',
  requiresAuth: true
})

// Reactive data
const sessions = ref<any[]>([])
const messages = ref<any[]>([])
const currentSessionId = ref<string | null>(null)
const inputMessage = ref('')
const isLoading = ref(false)
const messagesArea = ref<HTMLElement>()

// Computed
const currentSession = computed(() => 
  sessions.value.find(s => s.id === currentSessionId.value)
)

// Fetch chat sessions
const fetchSessions = async () => {
  try {
    const { data } = await $fetch('/api/chat/user/sessions')
    sessions.value = data.sessions || []
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  }
}

// Fetch messages for a session
const fetchMessages = async (sessionId: string) => {
  try {
    const { data } = await $fetch('/api/chat/user/messages', {
      params: { sessionId }
    })
    messages.value = data.messages || []
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  }
}

// Select a session
const selectSession = async (sessionId: string) => {
  currentSessionId.value = sessionId
  await fetchMessages(sessionId)
}

// Create new session
const createNewSession = () => {
  currentSessionId.value = null
  messages.value = []
  inputMessage.value = ''
}

// Send message
const sendMessage = async () => {
  if (!inputMessage.trim() || isLoading.value) return

  const messageText = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true

  // Add user message to UI immediately
  const tempUserMessage = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content: messageText,
    createdAt: new Date().toISOString()
  }
  messages.value.push(tempUserMessage)
  scrollToBottom()

  try {
    const response = await $fetch('/api/chat/user/send', {
      method: 'POST',
      body: {
        sessionId: currentSessionId.value,
        message: messageText
      }
    })

    // Update session ID if new session was created
    if (!currentSessionId.value && response.sessionId) {
      currentSessionId.value = response.sessionId
      await fetchSessions() // Refresh sessions list
    }

    // Add assistant response
    messages.value.push({
      id: `resp-${Date.now()}`,
      role: 'assistant',
      content: response.message.content,
      createdAt: new Date().toISOString()
    })

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
    // Remove the temporary user message on error
    messages.value = messages.value.filter(m => m.id !== tempUserMessage.id)
  } finally {
    isLoading.value = false
  }
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight
  }
}

// Initialize
onMounted(() => {
  fetchSessions()
})
</script>

<style scoped>
.chat-sidebar {
  height: 600px;
  overflow-y: auto;
}

.chat-window {
  height: 600px;
}

.chat-header {
  background-color: rgba(var(--v-theme-surface), 1);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.messages-area {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.message {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
}

.user-message {
  background-color: rgba(var(--v-theme-primary), 0.1);
  margin-left: 20%;
}

.assistant-message {
  background-color: rgba(var(--v-theme-surface), 1);
  margin-right: 20%;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
  opacity: 0.8;
}

.message-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.chat-input-area {
  background-color: rgba(var(--v-theme-surface), 1);
}
</style>