<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// Fetch vendors and exams
const { data: vendorsData } = await useFetch('/api/vendors')
const vendors = computed(() => vendorsData.value?.data || [])

// Selected vendor filter
const selectedVendor = ref('')

// Fetch exams with vendor filter
const { data: examsData, refresh: refreshExams } = await useFetch('/api/exams', {
  query: {
    vendor: selectedVendor
  }
})
const exams = computed(() => examsData.value?.data || [])

// Search query
const searchQuery = ref('')

// Filtered exams based on search
const filteredExams = computed(() => {
  if (!searchQuery.value) return exams.value
  
  const query = searchQuery.value.toLowerCase()
  return exams.value.filter(exam => 
    exam.examCode.toLowerCase().includes(query) ||
    exam.examName.toLowerCase().includes(query)
  )
})

// Group exams by vendor
const examsByVendor = computed(() => {
  const grouped = {}
  filteredExams.value.forEach(exam => {
    const vendor = exam.vendorName || 'Unknown'
    if (!grouped[vendor]) {
      grouped[vendor] = []
    }
    grouped[vendor].push(exam)
  })
  return grouped
})

// Navigate to exam detail
const goToExam = (examId: string) => {
  navigateTo(`/exams/${examId}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <v-card flat class="mb-6">
      <v-card-title class="text-h4 font-weight-bold">
        Certification Exams
      </v-card-title>
      <v-card-subtitle>
        Choose an exam to start practicing
      </v-card-subtitle>
    </v-card>

    <!-- Filters -->
    <v-card flat class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search exams..."
              variant="outlined"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedVendor"
              :items="vendors"
              item-title="name"
              item-value="id"
              label="Filter by vendor"
              variant="outlined"
              clearable
              hide-details
              @update:model-value="refreshExams"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Exams List -->
    <div v-if="Object.keys(examsByVendor).length > 0">
      <div v-for="(vendorExams, vendorName) in examsByVendor" :key="vendorName" class="mb-6">
        <h3 class="text-h6 font-weight-bold mb-3">{{ vendorName }}</h3>
        
        <v-row>
          <v-col 
            v-for="exam in vendorExams" 
            :key="exam.id"
            cols="12"
            md="4"
            lg="3"
          >
            <v-card 
              @click="goToExam(exam.id)"
              :elevation="2"
              class="h-100 cursor-pointer"
              hover
            >
              <v-card-text>
                <div class="text-h6 font-weight-bold text-primary mb-1">
                  {{ exam.examCode }}
                </div>
                <div class="text-body-2 mb-3">
                  {{ exam.examName }}
                </div>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex flex-column gap-1 text-body-2">
                  <div>
                    <v-icon size="small" class="mr-1">mdi-help-circle</v-icon>
                    {{ exam.numberOfQuestions }} questions
                  </div>
                  <div>
                    <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                    {{ exam.examDuration }} minutes
                  </div>
                  <div>
                    <v-icon size="small" class="mr-1">mdi-percent</v-icon>
                    Pass: {{ exam.passingScore }}%
                  </div>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-btn
                  color="primary"
                  variant="text"
                  block
                >
                  Start Practicing
                  <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Empty State -->
    <v-card v-else flat class="text-center py-12">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-file-document-outline
      </v-icon>
      <v-card-title class="text-h5">
        No exams found
      </v-card-title>
      <v-card-subtitle>
        Try adjusting your search or filter criteria
      </v-card-subtitle>
    </v-card>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>