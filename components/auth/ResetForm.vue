<script setup lang="ts">
import { ref } from 'vue';
const valid = ref(true);
const show1 = ref(false);
const email = ref('');
const emailRules = ref([(v: string) => !!v || 'E-mail is required', (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid']);
</script>
<template>
    <v-form ref="form" v-model="valid" lazy-validation action="/dashboards/analytical" class="mt-sm-13 mt-8">
        <v-label class="text-subtitle-1 font-weight-medium pb-2 text-lightText">Email Address</v-label>
        <VTextField v-model="email" :rules="emailRules" required ></VTextField>
        <v-btn size="large" color="primary" to="/" block  submit rounded="pill">Forgot Password</v-btn>
    </v-form>
</template>
