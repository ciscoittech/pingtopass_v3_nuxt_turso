# 🎨 UI Components Guide

## Overview

This guide documents all custom UI components built for PingToPass using the Spike Admin theme and Vuetify 3.

## Table of Contents

1. [Core Components](#core-components)
2. [Exam Components](#exam-components)
3. [Study Components](#study-components)
4. [Dashboard Components](#dashboard-components)
5. [Shared Components](#shared-components)
6. [Performance Components](#performance-components)
7. [Component Patterns](#component-patterns)

## Core Components

### BaseBreadcrumb

Navigation breadcrumb component following Spike theme patterns.

```vue
<BaseBreadcrumb 
  :title="pageTitle" 
  :breadcrumbs="breadcrumbItems"
/>
```

**Props:**
- `title` (string): Page title
- `breadcrumbs` (array): Array of breadcrumb items with `text`, `to`, and `disabled` properties

### UiParentCard

Base card component with elevation 10 (Spike standard).

```vue
<UiParentCard title="Card Title" :loading="isLoading">
  <template #action>
    <v-btn color="primary">Action</v-btn>
  </template>
  
  <!-- Card content -->
</UiParentCard>
```

**Props:**
- `title` (string): Card title
- `loading` (boolean): Show loading state
- `color` (string): Card color variant

**Slots:**
- `default`: Card content
- `action`: Card header actions

## Exam Components

### ExamCard

Display exam information in a card format with Spike theme styling.

```vue
<ExamCard 
  :exam="examData"
  @toggle-bookmark="handleBookmark"
  @view-details="handleViewDetails"
  @start-exam="handleStartExam"
/>
```

**Props:**
- `exam` (Exam): Exam object or individual exam properties
- Supports both object and individual prop patterns for backward compatibility

**Events:**
- `toggle-bookmark`: Bookmark toggled
- `view-details`: View details clicked
- `start-exam`: Start exam clicked

### ExamFilters

Advanced filtering component for exam catalog.

```vue
<ExamFilters
  :vendors="vendorList"
  :filters="currentFilters"
  :hasActiveFilters="hasFilters"
  @update:filters="updateFilters"
  @update:search="updateSearch"
  @update:sort="updateSort"
  @reset="resetFilters"
/>
```

### ExamCardSkeleton

Skeleton loader for exam cards.

```vue
<ExamCardSkeleton v-for="i in 12" :key="i" />
```

## Study Components

### StudyQuestionCard

Interactive question card for study mode.

```vue
<StudyQuestionCard
  :question="currentQuestion"
  :showAnswer="isAnswerRevealed"
  :selectedAnswer="userAnswer"
  :multiSelect="question.multiSelect"
  @select-answer="handleAnswerSelect"
  @toggle-answer="toggleAnswer"
/>
```

### StudyProgress

Real-time study progress tracking component.

```vue
<StudyProgress
  :current="currentIndex"
  :total="totalQuestions"
  :correct="correctAnswers"
  :incorrect="incorrectAnswers"
/>
```

### StudyFlashcards

Flashcard deck management component.

```vue
<StudyFlashcards
  :decks="flashcardDecks"
  @create-deck="handleCreateDeck"
  @study-deck="handleStudyDeck"
  @edit-deck="handleEditDeck"
/>
```

## Dashboard Components

### WelcomeCard

Personalized welcome component with study stats.

```vue
<WelcomeCard :user="currentUser" :stats="userStats" />
```

### MetricCard

Reusable metric display card.

```vue
<MetricCard
  title="Total Study Time"
  :value="studyHours"
  subtitle="hours this month"
  icon="solar:clock-circle-bold-duotone"
  color="primary"
  trend="+12%"
/>
```

### ActivityTimeline

Study activity timeline component.

```vue
<ActivityTimeline 
  :activities="recentActivities"
  :loading="isLoading"
/>
```

## Shared Components

### SkeletonLoader

Flexible skeleton loader with presets.

```vue
<SkeletonLoader 
  type="text" 
  width="200px" 
  height="20px"
  rounded="rounded-md"
/>
```

**Types:**
- `text`: Text placeholder
- `avatar`: Circular avatar
- `card`: Card placeholder
- `image`: Image placeholder
- `button`: Button placeholder
- `custom`: Custom dimensions

### OptimizedImage

Performance-optimized image component.

```vue
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  :width="1200"
  :height="600"
  loading="lazy"
  fit="cover"
/>
```

**Features:**
- Lazy loading with intersection observer
- Blur placeholder support
- Responsive sizing
- Error handling

### LoadingOverlay

Full-screen loading overlay.

```vue
<LoadingOverlay 
  :active="isLoading" 
  message="Loading exams..."
/>
```

## Performance Components

### LazyApexChart

Lazy-loaded chart component for better performance.

```vue
<LazyApexChart
  type="area"
  :height="300"
  :options="chartOptions"
  :series="chartData"
/>
```

Loads ApexCharts only when component enters viewport.

## Component Patterns

### 1. Elevation System

All cards use Spike's elevation 10:

```vue
<v-card elevation="10" class="pa-6">
  <!-- Content -->
</v-card>
```

### 2. Color Scheme

Primary colors following Spike theme:
- Primary: Blue (#5D87FF)
- Secondary: Light Blue (#49BEFF)
- Success: Green (#4CAF50)
- Warning: Orange (#FF9800)
- Error: Red (#F44336)

### 3. Icon System

Using Solar icon set throughout:

```vue
<Icon icon="solar:book-bold-duotone" size="24" />
```

Common icons:
- Dashboard: `solar:widget-5-bold-duotone`
- Exams: `solar:document-text-bold-duotone`
- Study: `solar:book-bold-duotone`
- Progress: `solar:chart-line-duotone`
- Settings: `solar:settings-bold-duotone`

### 4. Loading States

Three types of loading states:

1. **Skeleton Loaders**: Initial data loading
2. **Progress Indicators**: Action in progress
3. **Shimmer Effects**: Content placeholders

### 5. Empty States

Consistent empty state pattern:

```vue
<div class="text-center py-8">
  <Icon :icon="emptyIcon" size="48" class="mb-4 text-grey-lighten-1" />
  <h6 class="text-h6 mb-2">{{ emptyTitle }}</h6>
  <p class="text-body-2 text-medium-emphasis mb-4">{{ emptySubtitle }}</p>
  <v-btn color="primary" variant="tonal" @click="handleAction">
    {{ actionText }}
  </v-btn>
</div>
```

### 6. Responsive Design

Mobile-first approach with breakpoints:
- `xs`: < 600px
- `sm`: 600px - 960px
- `md`: 960px - 1280px
- `lg`: 1280px - 1920px
- `xl`: > 1920px

### 7. Animation Patterns

Smooth transitions using Vuetify's transition components:

```vue
<v-expand-transition>
  <div v-if="expanded">
    <!-- Expandable content -->
  </div>
</v-expand-transition>
```

## Component Development Guidelines

### 1. TypeScript First

All components use TypeScript with proper typing:

```typescript
interface Props {
  title: string
  value: number
  trend?: string
}

const props = withDefaults(defineProps<Props>(), {
  trend: '0%'
})
```

### 2. Composition API

Use Composition API with `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

### 3. Props Validation

Always validate props with TypeScript interfaces.

### 4. Event Naming

Use kebab-case for event names:
- ✅ `@update:model-value`
- ❌ `@updateModelValue`

### 5. Accessibility

Include proper ARIA attributes:

```vue
<v-btn
  aria-label="Start exam"
  :aria-busy="loading"
>
  Start Exam
</v-btn>
```

## Testing Components

### Unit Testing

Test components with Vitest:

```typescript
import { mount } from '@vue/test-utils'
import ExamCard from '@/components/exam/ExamCard.vue'

describe('ExamCard', () => {
  it('displays exam information', () => {
    const wrapper = mount(ExamCard, {
      props: { exam: mockExam }
    })
    
    expect(wrapper.text()).toContain(mockExam.name)
  })
})
```

### E2E Testing

Test user flows with Playwright:

```typescript
test('user can filter exams', async ({ page }) => {
  await page.goto('/exams')
  await page.click('[data-test="vendor-filter"]')
  await page.click('text=Microsoft')
  
  await expect(page.locator('.exam-card')).toHaveCount(5)
})
```