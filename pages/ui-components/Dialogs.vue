<script setup lang="ts">
import { ref } from 'vue';
// common components
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

import DialogsActivator from '@/components/ui-components/dialogs/DialogsActivator.vue';
import DialogsModel from '@/components/ui-components/dialogs/DialogsModel.vue';
import DialogsFullscreen from '@/components/ui-components/dialogs/DialogsFullscreen.vue';
import DialogsTransitions from '@/components/ui-components/dialogs/DialogsTransitions.vue';
import DialogsPersistent from '@/components/ui-components/dialogs/DialogsPersistent.vue';
import DialogsScrollable from '@/components/ui-components/dialogs/DialogsScrollable.vue';
import DialogsForm from '@/components/ui-components/dialogs/DialogsForm.vue';
import DialogsNested from '@/components/ui-components/dialogs/DialogsNested.vue';
// theme breadcrumb
const page = ref({ title: 'Dialog' });
const breadcrumbs = ref([
    {
        text: 'Dashboard',
        disabled: false,
        href: '/'
    },
    {
        text: 'Dialog',
        disabled: true,
        href: '#'
    }
]);
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Dialog">
               <v-row>
                    <v-col cols="12" sm="12" lg="4">
                        <UiChildCard title="Simple">
                            <DialogsActivator />
                        </UiChildCard>
                    </v-col>
                    <v-col cols="12" sm="12" lg="4">
                        <UiChildCard title="V-model">
                            <DialogsModel />
                        </UiChildCard>
                    </v-col>
                    <v-col cols="12" sm="12" lg="4" class="d-flex align-items-stretch">
                        <UiChildCard title="Transition">
                            <DialogsTransitions />
                        </UiChildCard>
                    </v-col>
                    <v-col cols="12" sm="12" lg="4" class="d-flex align-items-stretch">
                        <UiChildCard title="Form">
                            <DialogsForm />
                        </UiChildCard>
                    </v-col>
                    <v-col cols="12" sm="12" lg="4" class="d-flex align-items-stretch">
                        <UiChildCard title="Full screen">
                            <DialogsFullscreen />
                        </UiChildCard>
                    </v-col>
                   
                    <v-col cols="12" sm="12" lg="4" class="d-flex align-items-stretch">
                        <UiChildCard title="Persistent">
                            <DialogsPersistent />
                        </UiChildCard>
                    </v-col>
                    <v-col cols="12" sm="12" lg="4" class="d-flex align-items-stretch">
                        <UiChildCard title="Scrollable">
                            <DialogsScrollable />
                        </UiChildCard>
                    </v-col>
                    
                    <v-col cols="12" sm="12" lg="4" class="d-flex align-items-stretch">
                        <UiChildCard title="Nested Dialog">
                            <DialogsNested />
                        </UiChildCard>
                    </v-col>
                </v-row>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
