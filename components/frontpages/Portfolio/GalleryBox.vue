<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGalleryStore } from '@/stores/apps/userprofile/gallery';

import image1 from '/images/products/s1.jpg';
import image2 from '/images/products/s2.jpg';
import image3 from '/images/products/s3.jpg';
import image4 from '/images/products/s4.jpg';
import image5 from '/images/products/s5.jpg';
import image6 from '/images/products/s6.jpg';
import image7 from '/images/products/s7.jpg';
import image8 from '/images/products/s8.jpg';
import image9 from '/images/products/s9.jpg';
import image10 from '/images/products/s10.jpg';
import image11 from '/images/products/s11.jpg';
import image12 from '/images/products/s12.jpg';

const store = useGalleryStore();

onMounted(() => {
    store.fetchGallery();
});

const getPhotos: any = computed(() => {
    return store.gallery;
});
const searchValue = ref('');
// dropdown data
const actionDD = ref([
    { title: 'Remove Tag' },
    { title: 'Download' },
    { title: 'Make Profile Picture' },
    { title: 'Make Cover Photo' },
    { title: 'Find support or Report Photo' }
]);

const filteredCards = computed(() => {
    return getPhotos.value.filter((card: any) => {
        return card.title.toLowerCase().includes(searchValue.value.toLowerCase());
    });
});

//Fancybox
const visibleRef = ref(false);
const indexRef = ref(0);
const imgs = [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10, image11, image12];
const showImg = (index: number) => {
    indexRef.value = index;
    visibleRef.value = true;
};

const onHide = () => (visibleRef.value = false);
const moveDisabled = ref(true);
</script>

<template>
    <v-container class="max-width-1218 portfolio pb-16">
        <v-row class="justify-content-end mt-5">
            <v-col cols="12">
                <div class="d-sm-flex align-center mb-5">
                    <h3 class="text-h3">
                        Portfolio
                        <v-chip size="small" class="ml-2 elevation-0" variant="elevated" color="secondary">{{
                            filteredCards.length
                        }}</v-chip>
                    </h3>
                    <v-sheet width="250" class="ml-0 ml-sm-auto mt-3 mt-sm-0">
                        <v-text-field
                            color="primary"
                            hide-details
                            variant="outlined"
                            placeholder="Search Gallery"
                            density="compact"
                            prepend-inner-icon="mdi-magnify"
                            v-model="searchValue"
                        >
                        </v-text-field>
                    </v-sheet>
                </div>
            </v-col>
            <v-col cols="12">
                <v-row>
                    <v-col cols="12" md="4" sm="6" v-for="(card, index) in filteredCards" :key="index">
                        <v-card elevation="10" class="card-hover overflow-hidden" @click="() => showImg(index)">
                            <v-avatar size="220" class="rounded-0 w-100">
                                <img :src="card.image" alt="gallery" width="450" />
                            </v-avatar>

                            <v-card-text>
                                <div class="d-flex align-center gap-3">
                                    <div>
                                        <h6 class="text-h6 mb-1">{{ card.title }}</h6>
                                        <span class="d-block text-truncate d-flex align-center gap-2 textSecondary">
                                            {{ card.dateTime }}
                                        </span>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>

                        <vue-easy-lightbox
                            :visible="visibleRef"
                            :moveDisabled="moveDisabled"
                            :imgs="imgs"
                            :index="indexRef"
                            @hide="onHide"
                        />
                    </v-col>
                </v-row>
            </v-col>
        </v-row>
    </v-container>
</template>

<style>
.vel-modal {
    background: rgba(0, 0, 0, 0.1);
}
.vel-img {
    box-shadow: none;
}
</style>
