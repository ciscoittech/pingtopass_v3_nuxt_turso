<script setup lang="ts">
import { ref } from "vue";
const rating7 = ref(3.5);
</script>
<template>
    <div >
        <ClientOnly><v-rating
            class="d-block mb-4"
            v-model="rating7"
            color="error"
            empty-icon="mdi-heart-outline"
            full-icon="mdi-heart"
            half-icon="mdi-heart-half"
            half-increments density="compact"
            hover
        ></v-rating></ClientOnly>
        <ClientOnly><v-rating
            class="d-block mb-4"
            v-model="rating7"
            color="primary"
            empty-icon="mdi-circle-outline"
            full-icon="mdi-circle"
            half-icon="mdi-circle-half"
            half-increments density="compact"
            hover
        ></v-rating></ClientOnly>
    </div>
</template>
