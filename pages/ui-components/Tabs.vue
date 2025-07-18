
<script setup lang="ts">
import { ref } from 'vue';
// common components
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
// icons
import { UserIcon, UserPlusIcon, UsersIcon, PhotoIcon, StarIcon, FileDescriptionIcon, CreditCardIcon, KeyIcon } from 'vue-tabler-icons';

import BasicTabs from "@/components/ui-components/tabs/BasicTabs.vue";
import CenterTabs from "@/components/ui-components/tabs/CenterTabs.vue";
import ColorTabs from "@/components/ui-components/tabs/ColorTabs.vue";
import DisableTabs from "@/components/ui-components/tabs/DisableTabs.vue";
import IconsWithLabelTabs from "@/components/ui-components/tabs/IconsWithLabelTabs.vue";
import IconTabs from "@/components/ui-components/tabs/IconTabs.vue";
import CustomIcons from "@/components/ui-components/tabs/CustomIcons.vue";
import AlignCenterTabs from "@/components/ui-components/tabs/AlignCenterTabs.vue";
import AlignEndTabs from "@/components/ui-components/tabs/AlignEndTabs.vue";
// theme breadcrumb
const page = ref({ title: 'Tabs' });
const breadcrumbs = ref([
    {
        text: 'Dashboard',
        disabled: false,
        href: '/'
    },
    {
        text: 'Tabs',
        disabled: true,
        href: '#'
    }
]);
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Tabs">
                <v-row>
                    <!-- Basic -->
                    <v-col cols="12" lg="12">
                        <UiChildCard title="Basic">
                            <BasicTabs/>
                        </UiChildCard>
                    </v-col>
                    <!-- With Icons -->
                    <v-col cols="12" lg="12">
                        <UiChildCard title="Stacked">
                            <IconsWithLabelTabs/>
                        </UiChildCard>
                    </v-col>      
                    <!-- Center -->
                    <v-col cols="12" lg="12">
                        <UiChildCard title="Center Active">
                            <CenterTabs/>
                        </UiChildCard>
                    </v-col>
                      <!-- Custom Icons -->
                      <v-col cols="12" lg="12">
                        <UiChildCard title="Custom Icons">
                            <CustomIcons/>
                        </UiChildCard>
                    </v-col>
                     <!-- Align Center -->
                     <v-col cols="12" lg="12">
                        <UiChildCard title="Align Center">
                            <AlignCenterTabs/>
                        </UiChildCard>
                    </v-col>
                    <!-- Align End -->
                    <v-col cols="12" lg="12">
                        <UiChildCard title="Align End">
                            <AlignEndTabs/>
                        </UiChildCard>
                    </v-col>
                     <!-- Icons -->
                     <v-col cols="12" lg="12">
                        <UiChildCard title="Icon">
                            <IconTabs/>
                        </UiChildCard>
                    </v-col>
                    <!-- Disabled -->
                    <v-col cols="12" lg="12">
                        <UiChildCard title="Disabled">
                            <DisableTabs/>
                        </UiChildCard>
                    </v-col>
                    <!-- Colors -->
                    <v-col cols="12" lg="12">
                        <UiChildCard title="Colors">
                            <ColorTabs/>
                        </UiChildCard>
                    </v-col>
                </v-row>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
