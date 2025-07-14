<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { useCustomizerStore } from '@/stores/customizer';
import { sidebarItem } from './pingtopassSidebarItems';
const customizer = useCustomizerStore();
const sidebarMenu = shallowRef(sidebarItem);
</script>

<template>
    <v-navigation-drawer left v-model="customizer.Sidebar_drawer" elevation="10" rail-width="70" 
        app class="leftSidebar ms-lg-5 mt-sm-5 bg-containerBg" :rail="customizer.mini_sidebar" expand-on-hover width="270">
        <div class="pa-5 pl-4 ">
            <LcFullLogo/>
        </div>
        <!-- ---------------------------------------------- -->
        <!---Navigation -->
        <!-- ---------------------------------------------- -->
        <div class="scrollnavbar bg-containerBg overflow-y-auto" style="height: calc(100vh - 100px);">
            <v-list class="py-4 px-4 bg-containerBg">
                <!---Menu Loop -->
                <template v-for="(item, i) in sidebarMenu">
                    <!---Item Sub Header -->
                    <LcFullVerticalSidebarNavGroup :item="item" v-if="item.header" :key="item.title" />
                    <!---If Has Child -->
                    <LcFullVerticalSidebarNavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
                    <!---Single Item-->
                    <LcFullVerticalSidebarNavItem :item="item" v-else class="leftPadding" />
                    <!---End Single Item-->
                </template>
                <!-- <Moreoption/> -->
            </v-list>
            <div class="pa-6 px-4 userbottom mt-10">
                <LcFullVerticalSidebarExtrabox/>
            </div>
        </div>
    </v-navigation-drawer>
</template>
