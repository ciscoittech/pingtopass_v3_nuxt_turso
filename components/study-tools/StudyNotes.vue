<template>
  <div>
    <!-- Notes Header and Filters -->
    <v-row v-if="!loading && notes.length > 0" class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <h2 class="text-h5 font-weight-semibold">Study Notes</h2>
          <div class="d-flex gap-2 align-center">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search notes..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              style="max-width: 300px"
            >
              <template v-slot:prepend-inner>
                <Icon icon="solar:magnifer-linear" />
              </template>
            </v-text-field>
            <v-btn
              color="primary"
              variant="tonal"
              @click="showCreateNoteDialog = true"
            >
              <Icon icon="solar:add-circle-linear" class="mr-1" size="18" />
              New Note
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Notes List -->
    <v-row v-if="!loading && filteredNotes.length > 0">
      <v-col
        v-for="note in filteredNotes"
        :key="note.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="10"
          class="note-card h-100"
          hover
        >
          <v-card-item>
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-truncate">{{ note.title }}</span>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    v-bind="props"
                  >
                    <Icon icon="solar:menu-dots-bold" />
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="viewNote(note)">
                    <template v-slot:prepend>
                      <Icon icon="solar:eye-linear" />
                    </template>
                    <v-list-item-title>View</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="editNote(note)">
                    <template v-slot:prepend>
                      <Icon icon="solar:pen-2-linear" />
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="confirmDeleteNote(note)" class="text-error">
                    <template v-slot:prepend>
                      <Icon icon="solar:trash-bin-trash-linear" />
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>
            <v-card-subtitle>
              {{ formatDate(note.updatedAt) }} • {{ note.examCode || 'General' }}
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <!-- Note Preview -->
            <p class="text-body-2 note-preview mb-3">
              {{ truncateContent(note.content) }}
            </p>

            <!-- Tags -->
            <div v-if="note.tags && note.tags.length > 0" class="mb-2">
              <v-chip
                v-for="tag in note.tags.slice(0, 3)"
                :key="tag"
                size="small"
                variant="tonal"
                class="mr-1"
              >
                {{ tag }}
              </v-chip>
              <v-chip
                v-if="note.tags.length > 3"
                size="small"
                variant="text"
              >
                +{{ note.tags.length - 3 }}
              </v-chip>
            </div>

            <!-- Note Metadata -->
            <div class="d-flex align-center justify-space-between mt-3">
              <div class="d-flex align-center gap-2">
                <v-icon size="small" color="grey">solar:bookmark-linear</v-icon>
                <span class="text-caption text-medium-emphasis">
                  {{ note.bookmarked ? 'Bookmarked' : '' }}
                </span>
              </div>
              <v-chip
                :color="getNoteTypeColor(note.type)"
                size="x-small"
                variant="tonal"
              >
                {{ note.type || 'general' }}
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              block
              @click="viewNote(note)"
            >
              Read Note
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-else-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 mt-4">Loading notes...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && notes.length === 0" class="text-center py-12">
      <Icon icon="solar:notebook-broken" size="64" class="mb-4 text-grey-lighten-1" />
      <h5 class="text-h5 mb-2">No Notes Yet</h5>
      <p class="text-body-1 text-grey100 mb-4">
        Create notes to organize your study materials and insights
      </p>
      <v-btn
        color="primary"
        variant="flat"
        @click="showCreateNoteDialog = true"
      >
        <Icon icon="solar:add-circle-linear" class="mr-2" />
        Create Your First Note
      </v-btn>
    </div>

    <!-- No Results State -->
    <div v-else-if="!loading && filteredNotes.length === 0" class="text-center py-12">
      <Icon icon="solar:magnifer-broken" size="64" class="mb-4 text-grey-lighten-1" />
      <h5 class="text-h5 mb-2">No Notes Found</h5>
      <p class="text-body-1 text-grey100 mb-4">
        Try adjusting your search terms
      </p>
      <v-btn
        variant="text"
        @click="searchQuery = ''"
      >
        Clear Search
      </v-btn>
    </div>

    <!-- Create/Edit Note Dialog -->
    <v-dialog v-model="showCreateNoteDialog" max-width="900" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <Icon 
            :icon="editingNote ? 'solar:pen-2-bold' : 'solar:notebook-bold'" 
            class="mr-2" 
            size="24" 
          />
          {{ editingNote ? 'Edit' : 'Create' }} Note
        </v-card-title>
        
        <v-card-text>
          <v-form ref="noteForm" v-model="validNoteForm">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="noteFormData.title"
                  label="Note Title"
                  :rules="[v => !!v || 'Title is required']"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="noteFormData.type"
                  label="Note Type"
                  :items="['general', 'concept', 'summary', 'tips', 'reference']"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="noteFormData.examCode"
                  label="Related Exam (optional)"
                  :items="availableExams"
                  item-title="name"
                  item-value="code"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-combobox
                  v-model="noteFormData.tags"
                  label="Tags"
                  :items="suggestedTags"
                  variant="outlined"
                  density="compact"
                  multiple
                  chips
                  closable-chips
                  hint="Press enter to add custom tags"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="noteFormData.content"
                  label="Note Content"
                  :rules="[v => !!v || 'Content is required']"
                  variant="outlined"
                  rows="10"
                  placeholder="Write your note here. You can use Markdown formatting..."
                />
              </v-col>
              <v-col cols="12">
                <v-checkbox
                  v-model="noteFormData.bookmarked"
                  label="Bookmark this note"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeNoteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!validNoteForm"
            @click="saveNote"
          >
            {{ editingNote ? 'Update' : 'Create' }} Note
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Note Dialog -->
    <v-dialog v-model="showViewDialog" max-width="800">
      <v-card v-if="viewingNote">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ viewingNote.title }}</span>
          <v-btn
            icon
            variant="text"
            @click="showViewDialog = false"
          >
            <Icon icon="solar:close-circle-linear" />
          </v-btn>
        </v-card-title>
        
        <v-card-subtitle>
          {{ formatDate(viewingNote.updatedAt) }} • {{ viewingNote.examCode || 'General' }}
        </v-card-subtitle>

        <v-card-text>
          <!-- Tags -->
          <div v-if="viewingNote.tags && viewingNote.tags.length > 0" class="mb-3">
            <v-chip
              v-for="tag in viewingNote.tags"
              :key="tag"
              size="small"
              variant="tonal"
              class="mr-1"
            >
              {{ tag }}
            </v-chip>
          </div>

          <!-- Content -->
          <div class="note-content">
            {{ viewingNote.content }}
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn
            variant="text"
            @click="editNote(viewingNote)"
          >
            <Icon icon="solar:pen-2-linear" class="mr-1" />
            Edit
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            @click="showViewDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <Icon icon="solar:trash-bin-trash-bold" class="mr-2" size="24" />
          Delete Note?
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete "{{ deletingNote?.title }}"?</p>
          <p class="text-body-2 text-medium-emphasis">
            This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteNote"
          >
            Delete Note
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Note {
  id: string
  title: string
  content: string
  type: string
  examCode?: string
  tags: string[]
  bookmarked: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  notes: Note[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['create', 'edit', 'delete', 'tag'])

// State
const searchQuery = ref('')
const showCreateNoteDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const editingNote = ref<Note | null>(null)
const viewingNote = ref<Note | null>(null)
const deletingNote = ref<Note | null>(null)
const validNoteForm = ref(false)
const noteForm = ref()

const noteFormData = ref({
  title: '',
  content: '',
  type: 'general',
  examCode: '',
  tags: [] as string[],
  bookmarked: false
})

// Mock data
const availableExams = ref([
  { code: 'AWS-SAA', name: 'AWS Solutions Architect Associate' },
  { code: 'AZ-900', name: 'Azure Fundamentals' },
  { code: 'CompTIA-A+', name: 'CompTIA A+' },
  { code: 'CompTIA-N+', name: 'CompTIA Network+' }
])

const suggestedTags = ref([
  'important', 'review', 'exam-tip', 'concept', 'practice', 
  'troubleshooting', 'commands', 'architecture', 'security'
])

// Computed
const filteredNotes = computed(() => {
  if (!searchQuery.value) return props.notes
  
  const query = searchQuery.value.toLowerCase()
  return props.notes.filter(note => 
    note.title.toLowerCase().includes(query) ||
    note.content.toLowerCase().includes(query) ||
    note.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// Helper functions
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const truncateContent = (content: string, maxLength = 150) => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const getNoteTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    concept: 'primary',
    summary: 'success',
    tips: 'warning',
    reference: 'info',
    general: 'grey'
  }
  return colors[type] || 'grey'
}

// Actions
const viewNote = (note: Note) => {
  viewingNote.value = note
  showViewDialog.value = true
}

const editNote = (note: Note) => {
  editingNote.value = note
  noteFormData.value = {
    title: note.title,
    content: note.content,
    type: note.type,
    examCode: note.examCode || '',
    tags: [...note.tags],
    bookmarked: note.bookmarked
  }
  showViewDialog.value = false
  showCreateNoteDialog.value = true
}

const confirmDeleteNote = (note: Note) => {
  deletingNote.value = note
  showDeleteDialog.value = true
}

const deleteNote = () => {
  if (deletingNote.value) {
    emit('delete', deletingNote.value.id)
  }
  showDeleteDialog.value = false
  deletingNote.value = null
}

const saveNote = async () => {
  if (!noteForm.value || !await noteForm.value.validate()) return

  if (editingNote.value) {
    emit('edit', editingNote.value.id, noteFormData.value)
  } else {
    emit('create', noteFormData.value)
  }

  closeNoteDialog()
}

const closeNoteDialog = () => {
  showCreateNoteDialog.value = false
  editingNote.value = null
  noteFormData.value = {
    title: '',
    content: '',
    type: 'general',
    examCode: '',
    tags: [],
    bookmarked: false
  }
  noteForm.value?.reset()
}
</script>

<style scoped>
.note-card {
  transition: transform 0.2s ease-in-out;
}

.note-card:hover {
  transform: translateY(-4px);
}

.note-preview {
  min-height: 60px;
  line-height: 1.5;
}

.note-content {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.95rem;
}
</style>