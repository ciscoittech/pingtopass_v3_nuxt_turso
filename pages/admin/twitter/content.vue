<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">Content Strategy</h1>
            <p class="text-subtitle-1 text-grey">
              AI-powered content recommendations based on competitor analysis
            </p>
          </div>
          <v-btn color="primary" @click="generateStrategy">
            <v-icon start>mdi-robot</v-icon>
            Generate Strategy
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Content Opportunities -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-title>
            <v-icon class="mr-2">mdi-lightbulb</v-icon>
            Content Opportunities
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="opportunity in contentOpportunities"
                :key="opportunity.id"
                cols="12"
                md="6"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-item>
                    <v-card-title class="text-h6">
                      {{ opportunity.topic }}
                    </v-card-title>
                    <v-card-subtitle>
                      {{ opportunity.category }}
                    </v-card-subtitle>
                  </v-card-item>
                  <v-card-text>
                    <p class="text-body-2 mb-3">{{ opportunity.description }}</p>
                    <v-chip-group>
                      <v-chip
                        v-for="keyword in opportunity.keywords"
                        :key="keyword"
                        size="small"
                        variant="tonal"
                      >
                        {{ keyword }}
                      </v-chip>
                    </v-chip-group>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      color="primary"
                      variant="tonal"
                      size="small"
                      @click="createContent(opportunity)"
                    >
                      Create Content
                    </v-btn>
                    <v-spacer />
                    <v-chip
                      :color="getScoreColor(opportunity.score)"
                      size="small"
                      variant="tonal"
                    >
                      Score: {{ opportunity.score }}%
                    </v-chip>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Content Calendar -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="10">
          <v-card-title>
            <v-icon class="mr-2">mdi-calendar</v-icon>
            Content Calendar
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in contentCalendar" :key="item.id">
                  <td>{{ formatDate(item.date) }}</td>
                  <td>{{ item.topic }}</td>
                  <td>
                    <v-chip size="small" variant="tonal">
                      {{ item.type }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip
                      :color="getStatusColor(item.status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.status }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="editContent(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

// Breadcrumb
const page = ref({ title: 'Content Strategy' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Twitter Intelligence',
    disabled: false,
    to: '/admin/twitter'
  },
  {
    text: 'Content Strategy',
    disabled: true,
    to: ''
  }
])

// Mock data
const contentOpportunities = ref([
  {
    id: '1',
    topic: 'CompTIA A+ Study Tips',
    category: 'Educational',
    description: 'High engagement potential based on competitor analysis',
    keywords: ['CompTIA', 'A+', 'Study Tips', 'Certification'],
    score: 85
  },
  {
    id: '2',
    topic: 'Cloud Certification Roadmap',
    category: 'Guide',
    description: 'Trending topic with low competition',
    keywords: ['Cloud', 'AWS', 'Azure', 'Roadmap'],
    score: 92
  }
])

const contentCalendar = ref([
  {
    id: '1',
    date: new Date('2024-01-20'),
    topic: 'Weekly Study Challenge',
    type: 'Engagement',
    status: 'scheduled'
  },
  {
    id: '2',
    date: new Date('2024-01-22'),
    topic: 'New Exam Release',
    type: 'Announcement',
    status: 'draft'
  }
])

// Methods
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString()
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'success'
    case 'scheduled': return 'info'
    case 'draft': return 'warning'
    default: return 'grey'
  }
}

const generateStrategy = () => {
  // TODO: Implement strategy generation
  console.log('Generating strategy...')
}

const createContent = (opportunity: any) => {
  // TODO: Implement content creation
  console.log('Creating content for', opportunity)
}

const editContent = (item: any) => {
  // TODO: Implement content editing
  console.log('Editing', item)
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>