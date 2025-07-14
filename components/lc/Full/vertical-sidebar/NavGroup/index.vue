<script setup>
import { Icon } from '@iconify/vue';
const props = defineProps({ item: Object });
</script>

<template>
    <v-list-subheader  class="smallCap text-capitalize text-subtitle-1 mt-7 d-flex align-items-center">
        <span class="mini-icon"><Icon icon="mdi:dots-horizontal" width="16" class="iconClass" /></span>
       <span class="mini-text font-weight-semibold pl-2 text-medium-emphasis text-uppercase text-body-2">{{ props.item.header }}</span> 
    </v-list-subheader>
</template>
