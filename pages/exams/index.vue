<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

// Require authentication
definePageMeta({
  middleware: 'auth'
})

// Breadcrumb
const page = ref({ title: 'Certification Exams' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Exam Catalog',
    disabled: true,
    to: ''
  }
])

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
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Filters -->
    <UiParentCard title="Browse Certification Exams" class="mb-6">
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
    </UiParentCard>

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
              variant="outlined"
              class="h-100 cursor-pointer border"
              hover
              @click="goToExam(exam.id)"
            >
              <v-card-item>
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal">
                    <Icon icon="solar:document-text-line-duotone" />
                  </v-avatar>
                </template>
                
                <v-card-title class="text-h6">
                  {{ exam.examCode }}
                </v-card-title>
                
                <v-card-subtitle class="text-body-2">
                  {{ exam.examName }}
                </v-card-subtitle>
              </v-card-item>
              
              <v-card-text>
                <v-list density="compact" class="pa-0">
                  <v-list-item class="px-0">
                    <template v-slot:prepend>
                      <Icon icon="solar:question-circle-linear" class="mr-2" size="16" />
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ exam.numberOfQuestions }} questions
                    </v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item class="px-0">
                    <template v-slot:prepend>
                      <Icon icon="solar:clock-circle-linear" class="mr-2" size="16" />
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ exam.examDuration }} minutes
                    </v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item class="px-0">
                    <template v-slot:prepend>
                      <Icon icon="solar:verified-check-linear" class="mr-2" size="16" />
                    </template>
                    <v-list-item-title class="text-body-2">
                      Pass: {{ exam.passingScore }}%
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
              
              <v-card-actions class="pt-0">
                <v-btn
                  color="primary"
                  variant="tonal"
                  block
                >
                  Start Practicing
                  <Icon icon="solar:arrow-right-linear" class="ml-1" />
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Empty State -->
    <UiParentCard v-else>
      <div class="text-center py-12">
        <Icon icon="solar:document-text-broken" size="64" class="mb-4 text-grey-lighten-1" />
        <h5 class="text-h5 mb-2">No exams found</h5>
        <p class="text-body-1 text-grey100">
          Try adjusting your search or filter criteria
        </p>
      </div>
    </UiParentCard>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>