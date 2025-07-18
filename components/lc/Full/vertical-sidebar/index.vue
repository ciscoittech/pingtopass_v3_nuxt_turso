<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue';
import { useCustomizerStore } from '@/stores/customizer';
import { sidebarItem } from './pingtopassSidebarItems';
import { useActiveSession } from '~/composables/useActiveSession';

const customizer = useCustomizerStore();
const { getDynamicSidebarItems } = useActiveSession();

// Debug log
console.log('Sidebar items loaded:', sidebarItem);

// Combine static and dynamic sidebar items
const sidebarMenu = computed(() => {
  console.log('Computing sidebar menu...');
  const items = [...sidebarItem];
  console.log('Static items:', items.length);
  
  const dynamicItems = getDynamicSidebarItems();
  console.log('Dynamic items:', dynamicItems.length);
  
  if (dynamicItems.length > 0) {
    // Find the index after "Exams" to insert dynamic items
    const examsIndex = items.findIndex(item => item.title === 'Exams');
    if (examsIndex >= 0) {
      // Insert a header for active sessions
      items.splice(examsIndex + 1, 0, 
        { header: "Active Sessions" },
        ...dynamicItems
      );
    }
  }
  
  console.log('Final menu items:', items.length);
  return items;
});
</script>

<template>
    <v-navigation-drawer left v-model="customizer.Sidebar_drawer" elevation="10" rail-width="70" 
        app class="leftSidebar ms-lg-5 mt-sm-5 bg-containerBg" :rail="customizer.mini_sidebar" expand-on-hover width="270">
        <div class="pa-5 pl-4 ">
            <LcFullLogoPingToPassLogo/>
        </div>
        <!-- ---------------------------------------------- -->
        <!---Navigation -->
        <!-- ---------------------------------------------- -->
        <perfect-scrollbar class="scrollnavbar bg-containerBg overflow-y-hidden">
            <v-list class="py-4 px-4 bg-containerBg">
                <!---Menu Loop -->
                <template v-for="(item, i) in sidebarMenu" :key="i">
                    <!---Item Sub Header -->
                    <LcFullVerticalSidebarNavGroup :item="item" v-if="item.header" />
                    <!---If Has Child -->
                    <LcFullVerticalSidebarNavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" :key="`collapse-${i}`" />
                    <!---Single Item-->
                    <LcFullVerticalSidebarNavItem :item="item" v-else class="leftPadding" :key="`item-${i}`" />
                    <!---End Single Item-->
                </template>
                <!-- <Moreoption/> -->
            </v-list>
            <div class="pa-6 px-4 userbottom mt-10">
                <LcFullVerticalSidebarExtrabox/>
            </div>
        </perfect-scrollbar>
    </v-navigation-drawer>
</template>
