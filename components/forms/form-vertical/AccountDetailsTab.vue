<script setup lang="ts">
import { ref } from 'vue';
/* Password hide/show */
const show2 = ref(true);
const show3 = ref(true);
</script>
<template>
    <v-row>
        <v-col cols="12" md="6">
            <div class="mb-6">
                <v-label class="font-weight-medium mb-2" for="vaunm">User Name</v-label>
                <v-text-field color="primary" variant="outlined" id="vaunm" type="text" placeholder="John" hide-details />
            </div>
            <div >
                <v-label class="font-weight-medium mb-2" for="vapwd">Password</v-label>
                <v-text-field
                    color="primary"
                    variant="outlined"
                    :type="show2 ? 'text' : 'password'"
                    placeholder="john.deo"
                    hide-details
                    class="text-subtitle-1"
                    :append-inner-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="show2 = !show2"
                    id="vapwd"
                >
                </v-text-field>
            </div>
        </v-col>
        <v-col cols="12" md="6">
            <div class="mb-6">
                <v-label class="font-weight-medium mb-2" for="vaenpm">Email</v-label>
                <v-text-field color="primary" variant="outlined" id="vaenpm" type="email" placeholder="john.deo" suffix="@example.com" hide-details />
            </div>
            <div>
                <v-label class="font-weight-medium mb-2" for="vacnmp">Confirm</v-label>
                <v-text-field
                    color="primary"
                    variant="outlined"
                    :type="show3 ? 'text' : 'password'"
                    placeholder="john.deo"
                    hide-details
                    class="text-subtitle-1"
                    :append-inner-icon="show3 ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="show3 = !show3"
                    id="vacnmp"
                >
                </v-text-field>
            </div>
        </v-col>
        <v-col cols="12" class="mb-2">
            <v-btn color="primary" rounded="pill">Submit</v-btn>
            <v-btn class="bg-lighterror text-error ml-4" rounded="pill">Cancel</v-btn>
        </v-col>
    </v-row>
</template>
