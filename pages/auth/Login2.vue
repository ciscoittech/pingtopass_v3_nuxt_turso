<script setup lang="ts">
definePageMeta({
    layout: "blank",
});
</script>
<template>
    <div class="authentication">
        <v-container fluid class="pa-3">
            <v-row class="h-100vh d-flex justify-center align-center">
                <v-col cols="12" class="d-flex align-center">
                    <div class="boxed-auth-wrap">
                        <v-card  elevation="10" class="px-sm-1 px-0  mx-auto" max-width="450">
                            <v-card-item class="pa-sm-8">
                                <div class="d-flex justify-center mb-5">
                                    <LcFullLogo />
                                </div>
                                <!-- <div class="text-h6 text-medium-emphasis text-center mb-6">Your Social Campaigns</div> -->
                                <AuthLoginForm />
                                <h6 class="text-subtitle-1  text-grey100 d-flex justify-center align-center mt-3">
                                    New to Spike?
                                    <v-btn class="pl-0 text-primary text-body-1 opacity-1 pl-2" height="auto"
                                        to="/auth/register" variant="plain">Create an account</v-btn>
                                </h6>
                            </v-card-item>
                        </v-card>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
