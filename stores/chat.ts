import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date | string
}

interface ChatSession {
  id: string
  title: string
  messageCount: number
  lastMessage?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export const useChatStore = defineStore('chat', () => {
  // State
  const isOpen = ref(false)
  const sessions = ref<ChatSession[]>([])
  const messages = ref<ChatMessage[]>([])
  const currentSessionId = ref<string | null>(null)
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const inputMessage = ref('')
  
  // Persisted state in localStorage
  const STORAGE_KEY = 'pingtopass-chat-state'
  
  // Initialize from localStorage
  const initializeFromStorage = () => {
    if (process.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          currentSessionId.value = data.currentSessionId || null
          unreadCount.value = data.unreadCount || 0
        } catch (e) {
          console.error('Failed to parse chat storage:', e)
        }
      }
    }
  }
  
  // Save state to localStorage
  const saveToStorage = () => {
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentSessionId: currentSessionId.value,
        unreadCount: unreadCount.value
      }))
    }
  }
  
  // Actions
  const toggleChat = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      markAsRead()
    }
  }
  
  const setOpen = (value: boolean) => {
    isOpen.value = value
    if (value) {
      markAsRead()
    }
  }
  
  const markAsRead = () => {
    unreadCount.value = 0
    saveToStorage()
  }
  
  const incrementUnread = () => {
    if (!isOpen.value) {
      unreadCount.value++
      saveToStorage()
    }
  }
  
  const setInputMessage = (value: string) => {
    inputMessage.value = value
  }
  
  const createNewSession = () => {
    currentSessionId.value = null
    messages.value = []
    saveToStorage()
  }
  
  // Fetch user's chat sessions
  const fetchSessions = async () => {
    try {
      const response = await $fetch('/api/chat/user/sessions')
      sessions.value = response.sessions || []
      
      // If we have sessions but no current session, select the first one
      if (sessions.value.length > 0 && !currentSessionId.value) {
        await selectSession(sessions.value[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }
  
  // Select a session and load its messages
  const selectSession = async (sessionId: string) => {
    currentSessionId.value = sessionId
    saveToStorage()
    
    try {
      const response = await $fetch('/api/chat/user/messages', {
        params: { sessionId }
      })
      messages.value = response.messages || []
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }
  
  // Send a message (with admin mode support)
  const sendMessage = async (text: string, isAdmin: boolean = false) => {
    if (!text.trim() || isLoading.value) return
    
    isLoading.value = true
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date()
    }
    messages.value.push(userMessage)
    inputMessage.value = ''
    
    try {
      // Use appropriate endpoint based on mode
      const endpoint = isAdmin ? '/api/chat/admin/send' : '/api/chat/user/send'
      const body: any = {
        sessionId: currentSessionId.value,
        message: text
      }
      
      // Add enableTools for admin mode
      if (isAdmin) {
        body.enableTools = true
      }
      
      const response = await $fetch(endpoint, {
        method: 'POST',
        body
      })
      
      // Update session ID if this was a new session
      if (!currentSessionId.value && response.sessionId) {
        currentSessionId.value = response.sessionId
        await fetchSessions() // Refresh sessions list
        saveToStorage()
      }
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: response.message.content,
        createdAt: new Date()
      }
      messages.value.push(assistantMessage)
      
      // Increment unread if chat is closed
      incrementUnread()
      
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the temporary user message on error
      messages.value = messages.value.filter(m => m.id !== userMessage.id)
      inputMessage.value = text // Restore input
      
      // Show error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date()
      }
      messages.value.push(errorMessage)
    } finally {
      isLoading.value = false
    }
  }
  
  // Initialize on mount
  if (process.client) {
    initializeFromStorage()
  }
  
  return {
    // State
    isOpen,
    sessions,
    messages,
    currentSessionId,
    unreadCount,
    isLoading,
    inputMessage,
    
    // Actions
    toggleChat,
    setOpen,
    markAsRead,
    setInputMessage,
    createNewSession,
    fetchSessions,
    selectSession,
    sendMessage
  }
})