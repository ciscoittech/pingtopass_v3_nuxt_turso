<template>
  <NuxtLayout>
    <v-container fluid>
      <v-row>
        <!-- Admin Chat Window -->
        <v-col cols="12">
          <v-card class="admin-chat-window d-flex flex-column" height="700">
            <!-- Chat Header -->
            <v-card-title class="chat-header d-flex justify-space-between align-center">
              <span>Admin AI Assistant</span>
              <div>
                <v-chip
                  :color="enableTools ? 'success' : 'grey'"
                  size="small"
                  class="mr-2"
                >
                  <v-icon start size="small">mdi-tools</v-icon>
                  Tools {{ enableTools ? 'Enabled' : 'Disabled' }}
                </v-chip>
                <v-switch
                  v-model="enableTools"
                  hide-details
                  density="compact"
                  color="success"
                  class="d-inline-flex"
                />
              </div>
            </v-card-title>
            <v-divider />

            <!-- Messages Area -->
            <v-card-text class="flex-grow-1 overflow-y-auto messages-area" ref="messagesArea">
              <div v-if="messages.length === 0" class="text-center text-grey mt-10">
                <v-icon size="64" color="grey">mdi-robot-industrial</v-icon>
                <p class="mt-4">Admin AI Assistant with system access</p>
                <p class="text-caption">
                  Available tools: {{ availableTools.join(', ') }}
                </p>
              </div>

              <div v-else>
                <div
                  v-for="message in messages"
                  :key="message.id"
                  :class="['message', message.role === 'user' ? 'user-message' : 'assistant-message']"
                >
                  <div class="message-header">
                    <v-icon size="small" class="mr-2">
                      {{ message.role === 'user' ? 'mdi-shield-account' : 'mdi-robot-industrial' }}
                    </v-icon>
                    <span class="font-weight-bold">
                      {{ message.role === 'user' ? 'Admin' : 'AI Assistant' }}
                    </span>
                  </div>
                  <div class="message-content">
                    <div v-if="message.toolCalls" class="tool-calls mb-2">
                      <v-chip
                        v-for="tool in message.toolCalls"
                        :key="tool.name"
                        color="info"
                        size="small"
                        class="mr-1"
                      >
                        <v-icon start size="small">mdi-function</v-icon>
                        {{ tool.name }}
                      </v-chip>
                    </div>
                    <div v-html="formatMessage(message.content)"></div>
                  </div>
                </div>

                <div v-if="isLoading" class="message assistant-message">
                  <div class="message-header">
                    <v-icon size="small" class="mr-2">mdi-robot-industrial</v-icon>
                    <span class="font-weight-bold">AI Assistant</span>
                  </div>
                  <div class="message-content">
                    <v-progress-circular
                      indeterminate
                      size="16"
                      width="2"
                      class="mr-2"
                    />
                    Processing...
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
                placeholder="Ask about system stats, user analytics, or any admin task..."
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

      <!-- Tool Examples -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>Example Questions</v-card-title>
            <v-card-text>
              <v-chip-group>
                <v-chip
                  v-for="example in exampleQuestions"
                  :key="example"
                  @click="inputMessage = example"
                  class="ma-1"
                >
                  {{ example }}
                </v-chip>
              </v-chip-group>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

// Page metadata
definePageMeta({
  title: 'Admin AI Assistant',
  requiresAuth: true,
  layout: 'admin'
})

// Reactive data
const messages = ref<any[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const enableTools = ref(true)
const messagesArea = ref<HTMLElement>()
const sessionId = ref<string | null>(null)

// Available tools list
const availableTools = [
  'getUserStats',
  'getExamAnalytics',
  'searchQuestions',
  'getRecentActivity',
  'getDatabaseStats'
]

// Example questions
const exampleQuestions = [
  'How many users do we have?',
  'Show me the top 5 most popular exams',
  'What is the average test score?',
  'Get recent activity for the last 7 days',
  'Search for questions about AWS Lambda',
  'Show database statistics'
]

// Format message content (handle tables, lists, etc.)
const formatMessage = (content: string) => {
  // Convert markdown-style formatting
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
  
  // Convert lists
  formatted = formatted.replace(/- (.*?)(<br>|$)/g, '• $1$2')
  
  return formatted
}

// Send message
const sendMessage = async () => {
  if (!inputMessage.trim() || isLoading.value) return

  const messageText = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true

  // Add user message to UI
  messages.value.push({
    id: `msg-${Date.now()}`,
    role: 'user',
    content: messageText,
    createdAt: new Date().toISOString()
  })
  scrollToBottom()

  try {
    const response = await $fetch('/api/chat/admin/send', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        message: messageText,
        enableTools: enableTools.value
      }
    })

    // Update session ID if new
    if (!sessionId.value && response.sessionId) {
      sessionId.value = response.sessionId
    }

    // Add assistant response
    const assistantMessage: any = {
      id: `resp-${Date.now()}`,
      role: 'assistant',
      content: response.message.content,
      createdAt: new Date().toISOString()
    }

    // Add tool call information if available
    if (response.toolCalls && response.toolCalls.length > 0) {
      assistantMessage.toolCalls = response.toolCalls.map((tc: any) => ({
        name: tc.tool,
        args: tc.args,
        result: tc.result
      }))
    }

    messages.value.push(assistantMessage)

    await nextTick()
    scrollToBottom()
  } catch (error: any) {
    console.error('Failed to send message:', error)
    messages.value.push({
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Error: ${error.data?.statusMessage || error.message || 'Failed to process request'}`,
      createdAt: new Date().toISOString()
    })
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
</script>

<style scoped>
.admin-chat-window {
  height: 700px;
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

.message-content :deep(code) {
  background-color: rgba(var(--v-theme-on-surface), 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.chat-input-area {
  background-color: rgba(var(--v-theme-surface), 1);
}

.tool-calls {
  margin-bottom: 8px;
}
</style>