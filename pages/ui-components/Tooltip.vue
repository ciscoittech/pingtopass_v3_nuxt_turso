<script setup>
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

import SimpleTooltip from "@/components/ui-components/tooltip/SimpleTooltip.vue";
import IconTooltip from "@/components/ui-components/tooltip/IconTooltip.vue";
import ToggleTolltip from "@/components/ui-components/tooltip/ToggleTolltip.vue";
const page = ref({ title: 'Tooltip' });
const breadcrumbs = ref([
    {
        text: 'Dashboard',
        disabled: false,
        href: '/'
    },
    {
        text: 'Tooltip',
        disabled: true,
        href: '#'
    }
]);
</script>
<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12" md="6">
            <UiParentCard title="Simple">
                <SimpleTooltip/>
            </UiParentCard>
        </v-col>
        <v-col cols="12" md="6">
            <UiParentCard title="Icon">
                <IconTooltip/>
            </UiParentCard>
        </v-col>
        <v-col cols="12">
            <UiParentCard title="Toggle Tolltip">
                <ToggleTolltip/>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
