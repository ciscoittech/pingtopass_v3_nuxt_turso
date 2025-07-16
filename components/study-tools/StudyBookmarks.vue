<template>
  <div>
    <!-- Bookmarks Header and Filters -->
    <v-row v-if="!loading && bookmarks.length > 0" class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <h2 class="text-h5 font-weight-semibold">Bookmarked Questions</h2>
          <div class="d-flex gap-2 align-center">
            <v-select
              v-model="filterExam"
              label="Filter by Exam"
              :items="examOptions"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="min-width: 200px"
            />
            <v-btn-toggle
              v-model="filterStatus"
              density="compact"
              variant="outlined"
              divided
            >
              <v-btn value="all" size="small">All</v-btn>
              <v-btn value="unreviewed" size="small">To Review</v-btn>
              <v-btn value="reviewed" size="small">Reviewed</v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Bookmarks Grid -->
    <v-row v-if="!loading && filteredBookmarks.length > 0">
      <v-col cols="12">
        <v-expansion-panels
          v-model="expandedPanels"
          variant="accordion"
          multiple
        >
          <v-expansion-panel
            v-for="(bookmark, index) in filteredBookmarks"
            :key="bookmark.id"
            elevation="10"
            class="mb-2"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between w-100 pr-2">
                <div class="d-flex align-center gap-3">
                  <v-avatar
                    :color="bookmark.reviewed ? 'success' : 'warning'"
                    variant="tonal"
                    size="32"
                  >
                    <Icon 
                      :icon="bookmark.reviewed ? 'solar:check-circle-bold' : 'solar:bookmark-bold'" 
                      size="18" 
                    />
                  </v-avatar>
                  <div>
                    <p class="text-body-1 font-weight-medium mb-1">
                      {{ bookmark.question?.examCode }} - Question #{{ bookmark.question?.number || index + 1 }}
                    </p>
                    <p class="text-body-2 text-medium-emphasis">
                      Bookmarked {{ formatDate(bookmark.createdAt) }}
                    </p>
                  </div>
                </div>
                <v-chip
                  :color="getQuestionTypeColor(bookmark.question?.type)"
                  size="small"
                  variant="tonal"
                >
                  {{ bookmark.question?.type || 'multiple-choice' }}
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-card variant="flat">
                <v-card-text>
                  <!-- Question Text -->
                  <div class="mb-4">
                    <h6 class="text-h6 mb-2">Question:</h6>
                    <p class="text-body-1">{{ bookmark.question?.text }}</p>
                    
                    <!-- Code Block if present -->
                    <v-sheet
                      v-if="bookmark.question?.codeBlock"
                      color="grey-darken-4"
                      class="pa-3 mt-2 rounded"
                    >
                      <pre class="text-caption">{{ bookmark.question.codeBlock }}</pre>
                    </v-sheet>
                  </div>

                  <!-- Options -->
                  <div class="mb-4">
                    <h6 class="text-h6 mb-2">Options:</h6>
                    <v-list density="compact" class="pa-0">
                      <v-list-item
                        v-for="(option, optIndex) in bookmark.question?.options"
                        :key="optIndex"
                        class="px-0"
                      >
                        <template v-slot:prepend>
                          <v-avatar
                            :color="bookmark.question?.correctAnswers?.includes(optIndex) ? 'success' : 'grey'"
                            size="24"
                            variant="tonal"
                          >
                            {{ String.fromCharCode(65 + optIndex) }}
                          </v-avatar>
                        </template>
                        <v-list-item-title>{{ option }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </div>

                  <!-- Explanation -->
                  <div v-if="bookmark.question?.explanation" class="mb-4">
                    <h6 class="text-h6 mb-2">Explanation:</h6>
                    <v-alert
                      type="info"
                      variant="tonal"
                      density="compact"
                    >
                      {{ bookmark.question.explanation }}
                    </v-alert>
                  </div>

                  <!-- User Note -->
                  <div v-if="bookmark.note" class="mb-4">
                    <h6 class="text-h6 mb-2">Your Note:</h6>
                    <v-sheet
                      color="primary"
                      variant="tonal"
                      class="pa-3 rounded"
                    >
                      <p class="text-body-2">{{ bookmark.note }}</p>
                    </v-sheet>
                  </div>

                  <!-- Actions -->
                  <v-divider class="my-4" />
                  <div class="d-flex justify-space-between align-center">
                    <div class="d-flex gap-2">
                      <v-btn
                        variant="tonal"
                        size="small"
                        @click="markAsReviewed(bookmark)"
                        :disabled="bookmark.reviewed"
                      >
                        <Icon icon="solar:check-circle-linear" class="mr-1" />
                        {{ bookmark.reviewed ? 'Reviewed' : 'Mark as Reviewed' }}
                      </v-btn>
                      <v-btn
                        variant="tonal"
                        size="small"
                        @click="addNote(bookmark)"
                      >
                        <Icon icon="solar:pen-2-linear" class="mr-1" />
                        {{ bookmark.note ? 'Edit' : 'Add' }} Note
                      </v-btn>
                    </div>
                    <v-btn
                      color="error"
                      variant="text"
                      size="small"
                      @click="confirmRemoveBookmark(bookmark)"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" class="mr-1" />
                      Remove
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-else-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 mt-4">Loading bookmarks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && bookmarks.length === 0" class="text-center py-12">
      <Icon icon="solar:bookmark-broken" size="64" class="mb-4 text-grey-lighten-1" />
      <h5 class="text-h5 mb-2">No Bookmarked Questions</h5>
      <p class="text-body-1 text-grey100 mb-4">
        Bookmark questions during study sessions to review them later
      </p>
      <v-btn
        color="primary"
        variant="flat"
        to="/study"
      >
        Start Studying
        <Icon icon="solar:arrow-right-linear" class="ml-1" />
      </v-btn>
    </div>

    <!-- No Results State -->
    <div v-else-if="!loading && filteredBookmarks.length === 0" class="text-center py-12">
      <Icon icon="solar:filter-broken" size="64" class="mb-4 text-grey-lighten-1" />
      <h5 class="text-h5 mb-2">No Bookmarks Match Filters</h5>
      <p class="text-body-1 text-grey100 mb-4">
        Try adjusting your filters to see more bookmarks
      </p>
      <v-btn
        variant="text"
        @click="resetFilters"
      >
        Reset Filters
      </v-btn>
    </div>

    <!-- Practice Button -->
    <div v-if="!loading && filteredBookmarks.length > 0" class="text-center mt-6">
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        @click="$emit('study')"
      >
        <Icon icon="solar:play-circle-bold" class="mr-2" />
        Practice {{ filteredBookmarks.length }} Bookmarked Questions
      </v-btn>
    </div>

    <!-- Add/Edit Note Dialog -->
    <v-dialog v-model="showNoteDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <Icon icon="solar:pen-2-bold" class="mr-2" size="24" />
          {{ editingBookmark?.note ? 'Edit' : 'Add' }} Note
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="noteText"
            label="Your note about this question"
            rows="4"
            variant="outlined"
            auto-grow
            placeholder="Add any insights, reminders, or tips about this question..."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeNoteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveNote"
          >
            Save Note
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="showRemoveDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <Icon icon="solar:trash-bin-trash-bold" class="mr-2" size="24" />
          Remove Bookmark?
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to remove this bookmark?</p>
          <p class="text-body-2 text-medium-emphasis">
            You can bookmark it again during future study sessions.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showRemoveDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="removeBookmark"
          >
            Remove Bookmark
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Question {
  id: string
  examCode: string
  number?: number
  text: string
  type: string
  options: string[]
  correctAnswers: number[]
  explanation?: string
  codeBlock?: string
}

interface Bookmark {
  id: string
  question: Question
  note?: string
  reviewed: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  bookmarks: Bookmark[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['remove', 'study', 'update'])

// State
const filterExam = ref('')
const filterStatus = ref('all')
const expandedPanels = ref<number[]>([])
const showNoteDialog = ref(false)
const showRemoveDialog = ref(false)
const editingBookmark = ref<Bookmark | null>(null)
const removingBookmark = ref<Bookmark | null>(null)
const noteText = ref('')

// Computed
const examOptions = computed(() => {
  const exams = [...new Set(props.bookmarks.map(b => b.question.examCode))]
  return [
    { title: 'All Exams', value: '' },
    ...exams.map(exam => ({ title: exam, value: exam }))
  ]
})

const filteredBookmarks = computed(() => {
  let filtered = [...props.bookmarks]
  
  // Filter by exam
  if (filterExam.value) {
    filtered = filtered.filter(b => b.question.examCode === filterExam.value)
  }
  
  // Filter by status
  if (filterStatus.value === 'reviewed') {
    filtered = filtered.filter(b => b.reviewed)
  } else if (filterStatus.value === 'unreviewed') {
    filtered = filtered.filter(b => !b.reviewed)
  }
  
  return filtered
})

// Helper functions
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getQuestionTypeColor = (type?: string) => {
  const colors: Record<string, string> = {
    'multiple-choice': 'primary',
    'multiple-answer': 'success',
    'true-false': 'info',
    'fill-blank': 'warning'
  }
  return colors[type || 'multiple-choice'] || 'grey'
}

// Actions
const resetFilters = () => {
  filterExam.value = ''
  filterStatus.value = 'all'
}

const markAsReviewed = async (bookmark: Bookmark) => {
  emit('update', bookmark.id, { reviewed: true })
}

const addNote = (bookmark: Bookmark) => {
  editingBookmark.value = bookmark
  noteText.value = bookmark.note || ''
  showNoteDialog.value = true
}

const saveNote = () => {
  if (editingBookmark.value) {
    emit('update', editingBookmark.value.id, { note: noteText.value })
  }
  closeNoteDialog()
}

const closeNoteDialog = () => {
  showNoteDialog.value = false
  editingBookmark.value = null
  noteText.value = ''
}

const confirmRemoveBookmark = (bookmark: Bookmark) => {
  removingBookmark.value = bookmark
  showRemoveDialog.value = true
}

const removeBookmark = () => {
  if (removingBookmark.value) {
    emit('remove', removingBookmark.value.id)
  }
  showRemoveDialog.value = false
  removingBookmark.value = null
}
</script>

<style scoped>
:deep(.v-expansion-panel-title) {
  padding: 16px 20px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>