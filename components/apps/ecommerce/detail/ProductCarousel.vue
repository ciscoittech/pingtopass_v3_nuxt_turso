<script setup>
import { ref, computed } from 'vue';
import { useEcomStore } from '@/stores/apps/eCommerce';
import { useRoute } from 'vue-router';
import { Carousel, Slide, Navigation } from "vue3-carousel";
import 'vue3-carousel/dist/carousel.css';
import product1 from '/images/products/s1.jpg';
import product2 from '/images/products/s2.jpg';
import product3 from '/images/products/s3.jpg';
import product4 from '/images/products/s4.jpg';
import product5 from '/images/products/s5.jpg';
import product6 from '/images/products/s6.jpg';
import product7 from '/images/products/s7.jpg';
import product8 from '/images/products/s8.jpg';

const store = useEcomStore();
const route = useRoute();

const getDetailImage = computed(() => {
    return store.products[route.params.id - 1].image;
});

const slideShow = [
    {
        image: getDetailImage.value,
        id: 1
    },
    {
        image: product1,
        id: 2
    },
    {
        image: product2,
        id: 3
    },
    {
        image: product3,
        id: 4
    },
    {
        image: product4,
        id: 5
    },
    {
        image: product5,
        id: 6
    },
    {
        image: product6,
        id: 7
    },
    {
        image: product7,
        id: 8
    },
    {
        image: product8,
        id: 9
    }
];

const currentSlide = ref(0);
function slideTo(val) {
    currentSlide.value = val;
}
</script>

<template>
    <div>
        <Carousel id="gallery" :items-to-show="1" :wrap-around="false" v-model="currentSlide">
            <Slide v-for="(slide, i) in slideShow" :key="i">
                <div class="carousel__item">
                    <img alt="product" :src="slide.image" class="w-100 rounded-md" />
                </div>
            </Slide>

            <template #addons>
            <navigation class="navarrow mt-n9">
                <template #next>
                    <span>
                        <v-avatar size="25" class="bg-grey100">
                        <ChevronRightIcon class="text-surface" size="22" stroke-width="2" />
                    </v-avatar>
                    </span>
                </template>
                <template #prev>
                    <span>
                        <v-avatar size="25" class="bg-grey100">
                        <ChevronLeftIcon class="text-surface" size="22" stroke-width="2" />
                        </v-avatar>
                    </span>
                </template>
            </navigation>
        </template>
        </Carousel>

        <Carousel
            id="thumbnails"
            :currentSlide="currentSlide"
            :transition="500"
            :items-to-show="6"
            :wrap-around="false"
            v-model="currentSlide"
            ref="carousel"
            class="mt-3"
        >
            <Slide v-for="(slide, i) in slideShow" :key="i">
                <div class="carousel__item cursor-pointer " @click="slideTo(slide.id - 1)">
                    <img alt="product" :src="slide.image" class="w-100 rounded-md" />
                </div>
            </Slide>

            <!-- <template #addons>
                <Navigation />
            </template> -->
        </Carousel>
    </div>
</template>
<style lang="scss">
#thumbnails {
    &.carousel{
        margin: 0 -5px;
    }
    .carousel__slide {
        border: 2px solid transparent;
        line-height: 0px;
        padding: 0 5px;
    }
    .carousel__slide--active {
        img{
            border: 2px solid rgb(var(--v-theme-primary));
        }
        
    }
}
</style>
