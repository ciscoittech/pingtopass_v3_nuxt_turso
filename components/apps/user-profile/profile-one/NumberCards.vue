<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { BrandGithubIcon, BrandReactNativeIcon, IdIcon, LayoutIcon, TemplateIcon, UsersIcon, UserCheckIcon, FileDescriptionIcon} from 'vue-tabler-icons';

const { profileData } = useProfile();
</script>
<template>
    <v-row class="justify-content-center mb-4">
        <v-col cols="12" sm="4">
            <v-card elevation="10" class="bg-surface">
                <v-card-item class="py-6 px-md-6 px-5">
                    <div class="d-flex align-center">
                        <v-avatar size="48" class="bg-lightprimary">
                            <FileDescriptionIcon size="24" stroke-width="1.5" class="text-primary"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-h4 font-weight-semibold text-grey200 mb-1">{{ profileData?.stats?.posts || 0 }}</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">Posts</p>
                        </div> 
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
        <v-col cols="12" sm="4">
            <v-card elevation="10" class="bg-surface">
                <v-card-item class="py-6 px-md-6 px-5">
                    <div class="d-flex align-center">
                        <v-avatar size="48" class="bg-lightsuccess">
                            <UsersIcon size="24" stroke-width="1.5" class="text-success"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-h4 font-weight-semibold text-grey200 mb-1">{{ profileData?.stats?.followers || 0 }}</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">Followers</p>
                        </div> 
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
        <v-col cols="12" sm="4">
            <v-card elevation="10" class="bg-surface">
                <v-card-item class="py-6 px-md-6 px-5">
                    <div class="d-flex align-center">
                        <v-avatar size="48" class="bg-lighterror">
                            <UserCheckIcon size="24" stroke-width="1.5" class="text-error"/>
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-h4 font-weight-semibold text-grey200 mb-1">{{ profileData?.stats?.following || 0 }}</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">Following</p>
                        </div> 
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>
