<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Stats Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Total Bookmarks</p>
                <h4 class="text-h4 font-weight-bold">{{ totalBookmarks }}</h4>
              </div>
              <v-avatar color="primary" variant="tonal" size="48">
                <Icon icon="solar:bookmark-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Exams Covered</p>
                <h4 class="text-h4 font-weight-bold">{{ uniqueExams }}</h4>
              </div>
              <v-avatar color="success" variant="tonal" size="48">
                <Icon icon="solar:document-text-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">With Notes</p>
                <h4 class="text-h4 font-weight-bold">{{ bookmarksWithNotes }}</h4>
              </div>
              <v-avatar color="info" variant="tonal" size="48">
                <Icon icon="solar:notes-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">This Week</p>
                <h4 class="text-h4 font-weight-bold">{{ recentBookmarks }}</h4>
              </div>
              <v-avatar color="warning" variant="tonal" size="48">
                <Icon icon="solar:calendar-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bookmarks List -->
    <UiParentCard title="Your Bookmarked Questions">
      <template #action>
        <div class="d-flex gap-2 align-center">
          <v-select
            v-model="selectedExam"
            :items="examFilters"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="All Exams"
            clearable
            style="max-width: 200px"
          />
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            placeholder="Search bookmarks..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            style="max-width: 300px"
          />
          <v-btn
            icon
            variant="text"
            @click="viewMode = viewMode === 'card' ? 'list' : 'card'"
          >
            <Icon :icon="viewMode === 'card' ? 'solar:list-bold' : 'solar:widget-bold'" />
          </v-btn>
        </div>
      </template>

      <!-- Card View -->
      <v-row v-if="viewMode === 'card' && filteredBookmarks.length > 0">
        <v-col
          v-for="bookmark in filteredBookmarks"
          :key="bookmark.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card variant="outlined" class="h-100 border">
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:question-circle-bold" />
                </v-avatar>
              </template>
              <v-card-title class="text-body-1 font-weight-semibold">
                {{ bookmark.exam.code }}
              </v-card-title>
              <v-card-subtitle class="text-caption">
                Question #{{ bookmark.questionId }}
              </v-card-subtitle>
              <template v-slot:append>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="studyQuestion(bookmark)">
                      <template v-slot:prepend>
                        <Icon icon="solar:book-linear" />
                      </template>
                      <v-list-item-title>Study</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="editNotes(bookmark)">
                      <template v-slot:prepend>
                        <Icon icon="solar:pen-linear" />
                      </template>
                      <v-list-item-title>Edit Notes</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="removeBookmark(bookmark)" class="text-error">
                      <template v-slot:prepend>
                        <Icon icon="solar:trash-bin-trash-linear" />
                      </template>
                      <v-list-item-title>Remove</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-card-item>
            
            <v-card-text>
              <p class="text-body-2 mb-3 question-text">
                {{ truncateText(bookmark.question.questionText, 150) }}
              </p>
              
              <v-chip
                v-if="bookmark.question.difficultyLevel"
                :color="getDifficultyColor(bookmark.question.difficultyLevel)"
                size="small"
                variant="tonal"
                class="mb-2"
              >
                {{ bookmark.question.difficultyLevel }}
              </v-chip>
              
              <div v-if="bookmark.notes" class="mt-3">
                <div class="d-flex align-center mb-1">
                  <Icon icon="solar:notes-linear" class="mr-1" size="16" />
                  <span class="text-caption text-medium-emphasis">Your Notes:</span>
                </div>
                <p class="text-body-2 note-text">{{ bookmark.notes }}</p>
              </div>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer />
              <span class="text-caption text-medium-emphasis">
                {{ formatRelativeTime(bookmark.createdAt) }}
              </span>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- List View -->
      <v-list v-else-if="viewMode === 'list' && filteredBookmarks.length > 0" class="pa-0">
        <template v-for="(bookmark, index) in filteredBookmarks" :key="bookmark.id">
          <v-list-item class="px-0 py-3">
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal">
                {{ index + 1 }}
              </v-avatar>
            </template>
            
            <v-list-item-title class="mb-1">
              <span class="font-weight-semibold">{{ bookmark.exam.code }}</span>
              <v-chip size="x-small" class="ml-2" variant="tonal">
                Question #{{ bookmark.questionId }}
              </v-chip>
              <v-chip
                v-if="bookmark.question.difficultyLevel"
                :color="getDifficultyColor(bookmark.question.difficultyLevel)"
                size="x-small"
                variant="tonal"
                class="ml-2"
              >
                {{ bookmark.question.difficultyLevel }}
              </v-chip>
            </v-list-item-title>
            
            <v-list-item-subtitle class="text-wrap">
              {{ bookmark.question.questionText }}
            </v-list-item-subtitle>
            
            <div v-if="bookmark.notes" class="mt-2">
              <v-chip size="small" variant="tonal" color="info">
                <Icon icon="solar:notes-linear" class="mr-1" size="14" />
                Has notes
              </v-chip>
            </div>
            
            <template v-slot:append>
              <div class="d-flex align-center gap-1">
                <v-btn
                  icon="mdi-book-open-variant"
                  variant="text"
                  size="small"
                  @click="studyQuestion(bookmark)"
                />
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removeBookmark(bookmark)"
                />
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="index < filteredBookmarks.length - 1" />
        </template>
      </v-list>

      <!-- Empty State -->
      <div v-else-if="filteredBookmarks.length === 0" class="text-center py-12">
        <Icon icon="solar:bookmark-broken" size="64" class="mb-4 text-grey-lighten-1" />
        <h5 class="text-h5 mb-2">No Bookmarks Found</h5>
        <p class="text-body-1 text-grey100 mb-4">
          {{ searchQuery || selectedExam ? 'Try adjusting your filters' : 'Start bookmarking questions while studying' }}
        </p>
        <v-btn v-if="!searchQuery && !selectedExam" color="primary" variant="flat" :to="'/study'">
          Start Studying
          <Icon icon="solar:arrow-right-linear" class="ml-1" />
        </v-btn>
      </div>

      <!-- Loading State -->
      <div v-else class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Pagination -->
      <div v-if="pagination.hasMore" class="text-center mt-4">
        <v-btn
          variant="tonal"
          @click="loadMore"
          :loading="loading"
        >
          Load More
        </v-btn>
      </div>
    </UiParentCard>

    <!-- Edit Notes Dialog -->
    <v-dialog v-model="notesDialog" max-width="500">
      <v-card>
        <v-card-title>Edit Notes</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editingNotes"
            label="Your notes for this question"
            rows="4"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="notesDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveNotes">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Breadcrumb
const page = ref({ title: 'Bookmarked Questions' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Bookmarks',
    disabled: true,
    to: ''
  }
])

// State
const loading = ref(false)
const viewMode = ref<'card' | 'list'>('card')
const searchQuery = ref('')
const selectedExam = ref('')
const notesDialog = ref(false)
const editingBookmark = ref<any>(null)
const editingNotes = ref('')

// Fetch bookmarks
const limit = 12
const offset = ref(0)
const { data: bookmarksData, refresh: refreshBookmarks } = await useFetch('/api/study/bookmarks', {
  query: {
    limit,
    offset,
    examId: selectedExam
  }
})

const bookmarks = ref(bookmarksData.value?.data?.bookmarks || [])
const pagination = computed(() => bookmarksData.value?.data?.pagination || { hasMore: false })

// Stats
const totalBookmarks = computed(() => pagination.value.total || 0)
const uniqueExams = computed(() => {
  const exams = new Set(bookmarks.value.map((b: any) => b.exam.id))
  return exams.size
})
const bookmarksWithNotes = computed(() => 
  bookmarks.value.filter((b: any) => b.notes).length
)
const recentBookmarks = computed(() => {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  return bookmarks.value.filter((b: any) => 
    new Date(b.createdAt).getTime() > weekAgo
  ).length
})

// Exam filters
const examFilters = computed(() => {
  const exams = new Map()
  bookmarks.value.forEach((b: any) => {
    if (!exams.has(b.exam.id)) {
      exams.set(b.exam.id, {
        title: `${b.exam.code} - ${b.exam.name}`,
        value: b.exam.id
      })
    }
  })
  return Array.from(exams.values())
})

// Filtered bookmarks
const filteredBookmarks = computed(() => {
  let filtered = bookmarks.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((b: any) => 
      b.question.questionText.toLowerCase().includes(query) ||
      b.notes?.toLowerCase().includes(query) ||
      b.exam.code.toLowerCase().includes(query)
    )
  }
  
  if (selectedExam.value) {
    filtered = filtered.filter((b: any) => b.exam.id === selectedExam.value)
  }
  
  return filtered
})

// Watch filters
watch([selectedExam], async () => {
  offset.value = 0
  await refreshBookmarks()
})

// Methods
const loadMore = async () => {
  loading.value = true
  offset.value += limit
  
  const { data } = await $fetch('/api/study/bookmarks', {
    query: {
      limit,
      offset: offset.value,
      examId: selectedExam.value
    }
  })
  
  if (data?.bookmarks) {
    bookmarks.value.push(...data.bookmarks)
  }
  
  loading.value = false
}

const studyQuestion = (bookmark: any) => {
  navigateTo(`/study/${bookmark.exam.id}?question=${bookmark.questionId}`)
}

const editNotes = (bookmark: any) => {
  editingBookmark.value = bookmark
  editingNotes.value = bookmark.notes || ''
  notesDialog.value = true
}

const saveNotes = async () => {
  // TODO: Implement save notes API call
  if (editingBookmark.value) {
    editingBookmark.value.notes = editingNotes.value
  }
  notesDialog.value = false
}

const removeBookmark = async (bookmark: any) => {
  // TODO: Implement remove bookmark API call
  bookmarks.value = bookmarks.value.filter((b: any) => b.id !== bookmark.id)
}

// Helper functions
const truncateText = (text: string, length: number) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const formatRelativeTime = (date: string) => {
  const timestamp = new Date(date).getTime()
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

const getDifficultyColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'grey'
  }
}
</script>

<style scoped>
.question-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-text {
  background-color: rgba(var(--v-theme-info), 0.1);
  padding: 8px;
  border-radius: 4px;
  font-style: italic;
}
</style>