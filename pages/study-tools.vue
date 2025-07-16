<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Header with Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="0" class="bg-transparent">
          <v-card-text class="pa-0">
            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">Study Tools</h1>
                <p class="text-subtitle-1 text-grey100">
                  Enhance your learning with flashcards, notes, and personalized study resources
                </p>
              </div>
              
              <div class="d-flex gap-2 mt-2 mt-sm-0">
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="showCreateDialog = true"
                >
                  <Icon icon="solar:add-circle-linear" class="mr-2" size="20" />
                  Create New
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tool Categories -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card 
          elevation="10" 
          class="tool-card h-100"
          hover
          @click="activeSection = 'flashcards'"
          :class="{ 'active-tool': activeSection === 'flashcards' }"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar
                color="primary"
                variant="tonal"
                size="56"
              >
                <Icon icon="solar:card-2-bold-duotone" size="28" />
              </v-avatar>
            </template>
            <v-card-title class="font-weight-semibold">Flashcards</v-card-title>
            <v-card-subtitle>Quick review with interactive cards</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-h5 font-weight-bold mb-0">{{ flashcardStats.total }}</p>
                <p class="text-body-2 text-medium-emphasis">Total Cards</p>
              </div>
              <div class="text-right">
                <p class="text-h5 font-weight-bold mb-0">{{ flashcardStats.active }}</p>
                <p class="text-body-2 text-medium-emphasis">Active Decks</p>
              </div>
            </div>
            <v-progress-linear
              :model-value="flashcardStats.masteryPercentage"
              color="primary"
              height="6"
              rounded
              class="mt-3"
            />
            <p class="text-caption text-medium-emphasis mt-1">
              {{ flashcardStats.masteryPercentage }}% mastery
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="tonal"
              block
            >
              Study Flashcards
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card 
          elevation="10" 
          class="tool-card h-100"
          hover
          @click="activeSection = 'notes'"
          :class="{ 'active-tool': activeSection === 'notes' }"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar
                color="success"
                variant="tonal"
                size="56"
              >
                <Icon icon="solar:notebook-bold-duotone" size="28" />
              </v-avatar>
            </template>
            <v-card-title class="font-weight-semibold">Study Notes</v-card-title>
            <v-card-subtitle>Organize and review your notes</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-h5 font-weight-bold mb-0">{{ notesStats.total }}</p>
                <p class="text-body-2 text-medium-emphasis">Total Notes</p>
              </div>
              <div class="text-right">
                <p class="text-h5 font-weight-bold mb-0">{{ notesStats.recent }}</p>
                <p class="text-body-2 text-medium-emphasis">Recent</p>
              </div>
            </div>
            <v-chip-group class="mt-3">
              <v-chip
                v-for="tag in notesStats.topTags"
                :key="tag"
                size="small"
                variant="tonal"
              >
                {{ tag }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="success"
              variant="tonal"
              block
            >
              View Notes
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card 
          elevation="10" 
          class="tool-card h-100"
          hover
          @click="activeSection = 'bookmarks'"
          :class="{ 'active-tool': activeSection === 'bookmarks' }"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar
                color="warning"
                variant="tonal"
                size="56"
              >
                <Icon icon="solar:bookmark-bold-duotone" size="28" />
              </v-avatar>
            </template>
            <v-card-title class="font-weight-semibold">Bookmarked Questions</v-card-title>
            <v-card-subtitle>Review saved questions</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-h5 font-weight-bold mb-0">{{ bookmarkStats.total }}</p>
                <p class="text-body-2 text-medium-emphasis">Saved</p>
              </div>
              <div class="text-right">
                <p class="text-h5 font-weight-bold mb-0">{{ bookmarkStats.toReview }}</p>
                <p class="text-body-2 text-medium-emphasis">To Review</p>
              </div>
            </div>
            <div class="mt-3">
              <p class="text-caption text-medium-emphasis">Top exam:</p>
              <p class="text-body-2 font-weight-bold">{{ bookmarkStats.topExam || 'N/A' }}</p>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="warning"
              variant="tonal"
              block
            >
              Review Bookmarks
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Content Sections -->
    <v-row>
      <v-col cols="12">
        <!-- Flashcards Section -->
        <div v-if="activeSection === 'flashcards'">
          <StudyFlashcards
            :flashcards="flashcards"
            :loading="flashcardsLoading"
            @create="createFlashcard"
            @edit="editFlashcard"
            @delete="deleteFlashcard"
            @study="studyFlashcardDeck"
          />
        </div>

        <!-- Notes Section -->
        <div v-else-if="activeSection === 'notes'">
          <StudyNotes
            :notes="notes"
            :loading="notesLoading"
            @create="createNote"
            @edit="editNote"
            @delete="deleteNote"
            @tag="tagNote"
          />
        </div>

        <!-- Bookmarks Section -->
        <div v-else-if="activeSection === 'bookmarks'">
          <StudyBookmarks
            :bookmarks="bookmarks"
            :loading="bookmarksLoading"
            @remove="removeBookmark"
            @study="studyBookmarkedQuestions"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Create Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <Icon icon="solar:add-circle-bold" class="mr-2" size="24" />
          Create New Study Tool
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <p class="text-body-2 text-grey100 mb-4">
                Choose what type of study tool you want to create
              </p>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card
                variant="outlined"
                class="pa-4 text-center cursor-pointer"
                hover
                @click="createNewTool('flashcard')"
              >
                <Icon icon="solar:card-2-bold" size="48" class="mb-2" color="primary" />
                <h6 class="text-h6">Flashcard Deck</h6>
                <p class="text-body-2 text-grey100">Create interactive study cards</p>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card
                variant="outlined"
                class="pa-4 text-center cursor-pointer"
                hover
                @click="createNewTool('note')"
              >
                <Icon icon="solar:notebook-bold" size="48" class="mb-2" color="success" />
                <h6 class="text-h6">Study Note</h6>
                <p class="text-body-2 text-grey100">Write and organize notes</p>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showCreateDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import StudyFlashcards from '@/components/study-tools/StudyFlashcards.vue'
import StudyNotes from '@/components/study-tools/StudyNotes.vue'
import StudyBookmarks from '@/components/study-tools/StudyBookmarks.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Breadcrumb
const page = ref({ title: 'Study Tools' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Study Tools',
    disabled: true,
    to: ''
  }
])

// State
const activeSection = ref('flashcards')
const showCreateDialog = ref(false)

// Data fetching
const { data: flashcardsData, pending: flashcardsLoading, refresh: refreshFlashcards } = await useFetch('/api/study-tools/flashcards')
const { data: notesData, pending: notesLoading, refresh: refreshNotes } = await useFetch('/api/study-tools/notes')
const { data: bookmarksData, pending: bookmarksLoading, refresh: refreshBookmarks } = await useFetch('/api/study-tools/bookmarks')

// Computed
const flashcards = computed(() => flashcardsData.value?.data || [])
const notes = computed(() => notesData.value?.data || [])
const bookmarks = computed(() => bookmarksData.value?.data || [])

const flashcardStats = computed(() => {
  const total = flashcards.value.reduce((sum: number, deck: any) => sum + (deck.cards?.length || 0), 0)
  const active = flashcards.value.filter((deck: any) => deck.isActive).length
  const mastered = flashcards.value.reduce((sum: number, deck: any) => 
    sum + (deck.cards?.filter((card: any) => card.mastered).length || 0), 0
  )
  const masteryPercentage = total > 0 ? Math.round((mastered / total) * 100) : 0

  return { total, active, masteryPercentage }
})

const notesStats = computed(() => {
  const total = notes.value.length
  const recent = notes.value.filter((note: any) => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    return new Date(note.updatedAt).getTime() > weekAgo
  }).length
  
  const allTags = notes.value.flatMap((note: any) => note.tags || [])
  const tagCounts = allTags.reduce((acc: any, tag: string) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})
  
  const topTags = Object.entries(tagCounts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([tag]) => tag)

  return { total, recent, topTags }
})

const bookmarkStats = computed(() => {
  const total = bookmarks.value.length
  const toReview = bookmarks.value.filter((bookmark: any) => !bookmark.reviewed).length
  
  const examCounts = bookmarks.value.reduce((acc: any, bookmark: any) => {
    const examCode = bookmark.question?.examCode || 'Unknown'
    acc[examCode] = (acc[examCode] || 0) + 1
    return acc
  }, {})
  
  const topExam = Object.entries(examCounts)
    .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0]

  return { total, toReview, topExam }
})

// Actions
const createNewTool = (type: string) => {
  showCreateDialog.value = false
  if (type === 'flashcard') {
    activeSection.value = 'flashcards'
    // Open flashcard creation dialog
  } else if (type === 'note') {
    activeSection.value = 'notes'
    // Open note creation dialog
  }
}

const createFlashcard = async (data: any) => {
  try {
    await $fetch('/api/study-tools/flashcards', {
      method: 'POST',
      body: data
    })
    await refreshFlashcards()
  } catch (error) {
    console.error('Failed to create flashcard:', error)
  }
}

const editFlashcard = async (id: string, data: any) => {
  try {
    await $fetch(`/api/study-tools/flashcards/${id}`, {
      method: 'PUT',
      body: data
    })
    await refreshFlashcards()
  } catch (error) {
    console.error('Failed to edit flashcard:', error)
  }
}

const deleteFlashcard = async (id: string) => {
  try {
    await $fetch(`/api/study-tools/flashcards/${id}`, {
      method: 'DELETE'
    })
    await refreshFlashcards()
  } catch (error) {
    console.error('Failed to delete flashcard:', error)
  }
}

const studyFlashcardDeck = (deckId: string) => {
  navigateTo(`/study-tools/flashcards/${deckId}`)
}

const createNote = async (data: any) => {
  try {
    await $fetch('/api/study-tools/notes', {
      method: 'POST',
      body: data
    })
    await refreshNotes()
  } catch (error) {
    console.error('Failed to create note:', error)
  }
}

const editNote = async (id: string, data: any) => {
  try {
    await $fetch(`/api/study-tools/notes/${id}`, {
      method: 'PUT',
      body: data
    })
    await refreshNotes()
  } catch (error) {
    console.error('Failed to edit note:', error)
  }
}

const deleteNote = async (id: string) => {
  try {
    await $fetch(`/api/study-tools/notes/${id}`, {
      method: 'DELETE'
    })
    await refreshNotes()
  } catch (error) {
    console.error('Failed to delete note:', error)
  }
}

const tagNote = async (id: string, tags: string[]) => {
  try {
    await $fetch(`/api/study-tools/notes/${id}/tags`, {
      method: 'PUT',
      body: { tags }
    })
    await refreshNotes()
  } catch (error) {
    console.error('Failed to tag note:', error)
  }
}

const removeBookmark = async (id: string) => {
  try {
    await $fetch(`/api/study-tools/bookmarks/${id}`, {
      method: 'DELETE'
    })
    await refreshBookmarks()
  } catch (error) {
    console.error('Failed to remove bookmark:', error)
  }
}

const studyBookmarkedQuestions = () => {
  navigateTo('/study-tools/bookmarks/practice')
}
</script>

<style scoped>
.tool-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.tool-card:hover {
  transform: translateY(-4px);
}

.tool-card.active-tool {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>