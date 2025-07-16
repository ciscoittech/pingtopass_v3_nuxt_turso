<template>
  <div>
    <!-- Card Grid Skeleton -->
    <v-row v-if="type === 'card-grid'">
      <v-col
        v-for="i in count"
        :key="i"
        cols="12"
        :md="gridCols.md"
        :lg="gridCols.lg"
      >
        <v-skeleton-loader
          type="card"
          :height="cardHeight"
          :boilerplate="false"
          elevation="2"
        />
      </v-col>
    </v-row>
    
    <!-- List Skeleton -->
    <div v-else-if="type === 'list'">
      <v-skeleton-loader
        v-for="i in count"
        :key="i"
        type="list-item-avatar-two-line"
        :boilerplate="false"
        class="mb-3"
      />
    </div>
    
    <!-- Table Skeleton -->
    <v-skeleton-loader
      v-else-if="type === 'table'"
      type="table"
      :boilerplate="false"
    />
    
    <!-- Article Skeleton -->
    <v-skeleton-loader
      v-else-if="type === 'article'"
      type="article"
      :boilerplate="false"
    />
    
    <!-- Custom Skeleton -->
    <v-skeleton-loader
      v-else
      :type="type"
      :boilerplate="false"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'card-grid' | 'list' | 'table' | 'article' | string
  count?: number
  cardHeight?: number
  gridCols?: {
    md: number
    lg: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card-grid',
  count: 6,
  cardHeight: 300,
  gridCols: () => ({
    md: 6,
    lg: 4
  })
})
</script>