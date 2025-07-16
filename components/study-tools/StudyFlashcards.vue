<template>
  <div>
    <!-- Flashcard Decks Grid -->
    <v-row v-if="!loading && flashcards.length > 0">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5 font-weight-semibold">Flashcard Decks</h2>
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            @click="showCreateDeckDialog = true"
          >
            <Icon icon="solar:add-circle-linear" class="mr-1" size="18" />
            New Deck
          </v-btn>
        </div>
      </v-col>

      <v-col
        v-for="deck in flashcards"
        :key="deck.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          elevation="10"
          class="flashcard-deck h-100"
          hover
        >
          <v-card-item>
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-truncate">{{ deck.name }}</span>
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
                  <v-list-item @click="editDeck(deck)">
                    <template v-slot:prepend>
                      <Icon icon="solar:pen-2-linear" />
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="duplicateDeck(deck)">
                    <template v-slot:prepend>
                      <Icon icon="solar:copy-linear" />
                    </template>
                    <v-list-item-title>Duplicate</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="confirmDeleteDeck(deck)" class="text-error">
                    <template v-slot:prepend>
                      <Icon icon="solar:trash-bin-trash-linear" />
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>
            <v-card-subtitle>
              {{ deck.examCode }} • {{ deck.cards?.length || 0 }} cards
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <div class="flashcard-preview mb-3">
              <v-chip
                :color="deck.category === 'concepts' ? 'primary' : 
                        deck.category === 'definitions' ? 'success' : 
                        deck.category === 'commands' ? 'warning' : 'info'"
                size="small"
                variant="tonal"
              >
                {{ deck.category }}
              </v-chip>
            </div>

            <!-- Progress Stats -->
            <div class="mb-3">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">Progress</span>
                <span class="text-body-2 font-weight-bold">
                  {{ deck.masteredCount || 0 }}/{{ deck.cards?.length || 0 }}
                </span>
              </div>
              <v-progress-linear
                :model-value="getDeckProgress(deck)"
                :color="getDeckProgress(deck) === 100 ? 'success' : 'primary'"
                height="6"
                rounded
              />
            </div>

            <div class="text-body-2 text-medium-emphasis">
              Last studied: {{ formatLastStudied(deck.lastStudied) }}
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="flat"
              block
              @click="$emit('study', deck.id)"
            >
              Study Now
              <Icon icon="solar:play-circle-bold" class="ml-1" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-else-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 mt-4">Loading flashcards...</p>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Icon icon="solar:card-2-broken" size="64" class="mb-4 text-grey-lighten-1" />
      <h5 class="text-h5 mb-2">No Flashcards Yet</h5>
      <p class="text-body-1 text-grey100 mb-4">
        Create flashcard decks to enhance your learning experience
      </p>
      <v-btn
        color="primary"
        variant="flat"
        @click="showCreateDeckDialog = true"
      >
        <Icon icon="solar:add-circle-linear" class="mr-2" />
        Create Your First Deck
      </v-btn>
    </div>

    <!-- Create/Edit Deck Dialog -->
    <v-dialog v-model="showCreateDeckDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <Icon 
            :icon="editingDeck ? 'solar:pen-2-bold' : 'solar:add-circle-bold'" 
            class="mr-2" 
            size="24" 
          />
          {{ editingDeck ? 'Edit' : 'Create' }} Flashcard Deck
        </v-card-title>
        
        <v-card-text>
          <v-form ref="deckForm" v-model="validDeckForm">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="deckFormData.name"
                  label="Deck Name"
                  :rules="[v => !!v || 'Name is required']"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="deckFormData.category"
                  label="Category"
                  :items="['concepts', 'definitions', 'commands', 'troubleshooting']"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  v-model="deckFormData.examCode"
                  label="Exam"
                  :items="availableExams"
                  item-title="name"
                  item-value="code"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="deckFormData.description"
                  label="Description (optional)"
                  rows="2"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <!-- Cards Section -->
            <div class="mt-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <h6 class="text-h6">Cards</h6>
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  @click="addCard"
                >
                  <Icon icon="solar:add-circle-linear" class="mr-1" size="18" />
                  Add Card
                </v-btn>
              </div>

              <div
                v-for="(card, index) in deckFormData.cards"
                :key="index"
                class="card-editor mb-3"
              >
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <span class="text-body-2 font-weight-bold">Card {{ index + 1 }}</span>
                      <v-btn
                        icon
                        variant="text"
                        size="x-small"
                        color="error"
                        @click="removeCard(index)"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" />
                      </v-btn>
                    </div>
                    <v-row dense>
                      <v-col cols="12" md="6">
                        <v-textarea
                          v-model="card.front"
                          label="Front (Question)"
                          rows="3"
                          variant="outlined"
                          density="compact"
                          :rules="[v => !!v || 'Front is required']"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-textarea
                          v-model="card.back"
                          label="Back (Answer)"
                          rows="3"
                          variant="outlined"
                          density="compact"
                          :rules="[v => !!v || 'Back is required']"
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </div>

              <div v-if="deckFormData.cards.length === 0" class="text-center py-4">
                <p class="text-body-2 text-medium-emphasis">
                  No cards yet. Click "Add Card" to create your first flashcard.
                </p>
              </div>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeDeckDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!validDeckForm || deckFormData.cards.length === 0"
            @click="saveDeck"
          >
            {{ editingDeck ? 'Update' : 'Create' }} Deck
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <Icon icon="solar:trash-bin-trash-bold" class="mr-2" size="24" />
          Delete Deck?
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete "{{ deletingDeck?.name }}"?</p>
          <p class="text-body-2 text-medium-emphasis">
            This will permanently remove the deck and all {{ deletingDeck?.cards?.length || 0 }} cards.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteDeck"
          >
            Delete Deck
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Flashcard {
  id: string
  name: string
  examCode: string
  category: string
  description?: string
  cards: Array<{
    id?: string
    front: string
    back: string
    mastered?: boolean
  }>
  masteredCount?: number
  lastStudied?: string
  createdAt: string
  updatedAt: string
}

interface Props {
  flashcards: Flashcard[]
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['create', 'edit', 'delete', 'study'])

// State
const showCreateDeckDialog = ref(false)
const showDeleteDialog = ref(false)
const editingDeck = ref<Flashcard | null>(null)
const deletingDeck = ref<Flashcard | null>(null)
const validDeckForm = ref(false)
const deckForm = ref()

const deckFormData = ref({
  name: '',
  examCode: '',
  category: 'concepts',
  description: '',
  cards: [] as Array<{ front: string; back: string }>
})

// Mock exam data
const availableExams = ref([
  { code: 'AWS-SAA', name: 'AWS Solutions Architect Associate' },
  { code: 'AZ-900', name: 'Azure Fundamentals' },
  { code: 'CompTIA-A+', name: 'CompTIA A+' },
  { code: 'CompTIA-N+', name: 'CompTIA Network+' }
])

// Helper functions
const getDeckProgress = (deck: Flashcard) => {
  if (!deck.cards || deck.cards.length === 0) return 0
  const mastered = deck.masteredCount || 0
  return Math.round((mastered / deck.cards.length) * 100)
}

const formatLastStudied = (date?: string) => {
  if (!date) return 'Never'
  const now = new Date()
  const studied = new Date(date)
  const diffMs = now.getTime() - studied.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

// Actions
const addCard = () => {
  deckFormData.value.cards.push({ front: '', back: '' })
}

const removeCard = (index: number) => {
  deckFormData.value.cards.splice(index, 1)
}

const editDeck = (deck: Flashcard) => {
  editingDeck.value = deck
  deckFormData.value = {
    name: deck.name,
    examCode: deck.examCode,
    category: deck.category,
    description: deck.description || '',
    cards: deck.cards.map(c => ({ front: c.front, back: c.back }))
  }
  showCreateDeckDialog.value = true
}

const duplicateDeck = (deck: Flashcard) => {
  deckFormData.value = {
    name: `${deck.name} (Copy)`,
    examCode: deck.examCode,
    category: deck.category,
    description: deck.description || '',
    cards: deck.cards.map(c => ({ front: c.front, back: c.back }))
  }
  showCreateDeckDialog.value = true
}

const confirmDeleteDeck = (deck: Flashcard) => {
  deletingDeck.value = deck
  showDeleteDialog.value = true
}

const deleteDeck = () => {
  if (deletingDeck.value) {
    emit('delete', deletingDeck.value.id)
  }
  showDeleteDialog.value = false
  deletingDeck.value = null
}

const saveDeck = async () => {
  if (!deckForm.value || !await deckForm.value.validate()) return

  const deckData = {
    ...deckFormData.value,
    cards: deckFormData.value.cards.filter(c => c.front && c.back)
  }

  if (editingDeck.value) {
    emit('edit', editingDeck.value.id, deckData)
  } else {
    emit('create', deckData)
  }

  closeDeckDialog()
}

const closeDeckDialog = () => {
  showCreateDeckDialog.value = false
  editingDeck.value = null
  deckFormData.value = {
    name: '',
    examCode: '',
    category: 'concepts',
    description: '',
    cards: []
  }
  deckForm.value?.reset()
}
</script>

<style scoped>
.flashcard-deck {
  transition: transform 0.2s ease-in-out;
}

.flashcard-deck:hover {
  transform: translateY(-4px);
}

.card-editor {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 8px;
}
</style>